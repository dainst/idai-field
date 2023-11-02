defmodule FieldPublication.Processing do
  use GenServer
  alias FieldPublication.Processing.Image
  alias FieldPublication.Schemas.Publication
  alias FieldPublication.Publications

  alias Phoenix.PubSub

  require Logger

  def start_link(_opts) do
    Logger.debug("Starting Processing GenServer")
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    Logger.debug("Initializing Processing GenServer")
    {:ok, []}
  end

  ## API Functions to be called from the rest of the application

  def start(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:start, publication, :web_images})
  end

  def start(%Publication{} = publication, type) when type in [:web_images] do
    GenServer.call(__MODULE__, {:start, publication, type})
  end

  def show() do
    GenServer.call(__MODULE__, :show)
  end

  def show(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:show, Publications.get_doc_id(publication)})
  end

  def show(%Publication{} = publication, type) when type in [:web_images] do
    GenServer.call(__MODULE__, {:show, Publications.get_doc_id(publication), type})
  end

  def stop() do
    GenServer.call(__MODULE__, :stop)
  end

  def stop(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:stop, Publications.get_doc_id(publication)})
  end

  def stop(%Publication{} = publication, type) when type in [:web_images] do
    GenServer.call(__MODULE__, {:stop, Publications.get_doc_id(publication), type})
  end

  ## Starting, monitoring and stopping tasks as requested through the API functions above.

  def handle_call({:start, %Publication{} = publication, :web_images}, _from, running_tasks) do
    publication_id = Publications.get_doc_id(publication)

    Enum.any?(running_tasks, fn {_task, :web_images, context} ->
      publication_id == context
    end)
    |> case do
      false ->
        task =
          Task.Supervisor.async_nolink(
            FieldPublication.ProcessingSupervisor,
            Image,
            :start_web_image_processing,
            [publication]
          )

        broadcast(publication_id, :web_images, :processing_started)

        {:reply, :ok, running_tasks ++ [{task, :web_images, publication_id}]}

      true ->
        {:reply, :already_running, running_tasks}
    end
  end

  def handle_call(:show, _from, running_tasks) do
    {:reply, running_tasks, running_tasks}
  end

  def handle_call({:show, requested_context}, _from, running_tasks) do
    publication_tasks =
      Enum.filter(running_tasks, fn {_task, _type, context} ->
        context == requested_context
      end)

    {:reply, publication_tasks, running_tasks}
  end

  def handle_call({:show, requested_context, requested_type}, _from, running_tasks) do
    requested_task =
      Enum.find(running_tasks, fn {_task, type, context} ->
        context == requested_context and type == requested_type
      end)

    {:reply, requested_task, running_tasks}
  end

  def handle_call(:stop, _from, running_tasks) do
    Logger.debug("Stopping all processing for all publications.")

    Enum.each(running_tasks, fn {task, _type, _context} ->
      Process.exit(task.pid, :stopped)
    end)

    {:reply, :ok, running_tasks}
  end

  def handle_call({:stop, requested_context}, _from, running_tasks) do
    Logger.debug("Stopping all processing for #{requested_context}.")

    {publication_tasks, _remaining_tasks} =
      Enum.split_with(running_tasks, fn {_task, _type, context} ->
        context == requested_context
      end)

    Enum.each(publication_tasks, fn {task, _type, _context} ->
      Process.exit(task.pid, :stopped)
    end)

    {:reply, :ok, running_tasks}
  end

  def handle_call({:stop, requested_context, requested_type}, _from, running_tasks) do
    Logger.debug("Stopping '#{requested_type}' processing for #{requested_context}.")

    {publication_tasks, _remaining_tasks} =
      Enum.split_with(running_tasks, fn {_task, type, context} ->
        context == requested_context and type == requested_type
      end)

    Enum.each(publication_tasks, fn {task, _type, _context} ->
      Process.exit(task.pid, :stopped)
    end)

    {:reply, :ok, running_tasks}
  end

  # Handling of finished, stopped or crashed tasks

  def handle_info({ref, _answer}, running_tasks) do
    Logger.debug("A processing task has completed successfully.")
    Process.demonitor(ref, [:flush])
    {:noreply, cleanup(ref, running_tasks)}
  end

  def handle_info({:DOWN, ref, :process, _pid, :stopped}, running_tasks) do
    Logger.debug("A processing task was stopped by user.")
    {:noreply, cleanup(ref, running_tasks)}
  end

  def handle_info({:DOWN, ref, :process, _pid, _reason}, running_tasks) do
    Logger.error("A processing task failed irregularly.")
    {:noreply, cleanup(ref, running_tasks)}
  end

  defp cleanup(ref, task_list) do
    Enum.split_with(task_list, fn {task, _type, _context} ->
      task.ref == ref
    end)
    |> case do
      {[{_task, type, context}], rest} ->
        Logger.debug("Removing task '#{type}' for '#{context}' from task list.")
        broadcast(context, type, :processing_stopped)
        rest

      {[], rest} ->
        rest
    end
  end

  # PubSub interaction

  defp broadcast(channel, processing_type, msg)
       when msg in [:processing_started, :processing_stopped] do
    PubSub.broadcast!(FieldPublication.PubSub, channel, {msg, processing_type})
  end
end
