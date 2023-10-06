defmodule FieldPublication.Processing do
  alias Phoenix.PubSub

  alias FieldPublication.Processing.Image

  alias FieldPublication.Schemas.{
    LogEntry,
    Publication
  }

  defmodule Context do
    defstruct [:publication, :channel, :task_list]
  end

  require Logger

  @log_cache Application.compile_env(:field_publication, :processing_log_cache_name)

  def evaluate_processing_state(%Publication{project_name: project_name, draft_date: draft_date}) do
    %{
      images: Image.evaluate_unprocessed_images(project_name, draft_date)
    }
  end

  def start(%Context{task_list: task_list} = context) do
    Enum.map(task_list, fn(task) ->
      case task do
        :web_images ->
          {:web_images, Task.Supervisor.start_child(FieldPublication.TaskSupervisor, Image, :create_web_view_images, [context])}
        :map_tile_images ->
          {:map_tile_images, :todo}
        :search_indexing ->
          {:search_indexing, :todo}
      end
    end)
  end

  def log(channel, severity, msg) do
    case severity do
      :error ->
        Logger.error(msg)

      :warning ->
        Logger.error(msg)

      _ ->
        Logger.debug(msg)
    end

    {:ok, log_entry} =
      LogEntry.create(%{
        severity: severity,
        timestamp: DateTime.utc_now(),
        message: msg
      })

    case Cachex.get(@log_cache, channel) do
      {:ok, nil} ->
        Cachex.put(@log_cache, channel, [log_entry], ttl: :timer.hours(5))

      {:ok, entries} ->
        Cachex.put(@log_cache, channel, entries ++ [log_entry])
    end

    PubSub.broadcast(FieldPublication.PubSub, channel, {:file_processing_log, log_entry})
  end
end
