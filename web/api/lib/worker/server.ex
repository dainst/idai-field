defmodule Api.Worker.Server do
  use GenServer
  require Logger
  alias Api.Worker.IndexingSupervisor
  alias Api.Worker.Indexer
  alias Api.Worker.Images.TilesController
  alias Api.Worker.Images.ConversionController

  @moduledoc """
  The general design is that per project (at most) one
  task can run at any time.
  """

  @doc """
  Triggers the indexing of projects.
  Returns :ok, or :rejected, in case a task for any of the given projects is already running.
  """
  def reindex(projects), do: GenServer.call(__MODULE__, {:reindex, projects})

  @doc """
  Triggers the tile generation of projects.
  Returns :ok, or :rejected, in case a task for any of the given projects is already running.
  """
  def tiling(projects), do: GenServer.call(__MODULE__, {:tiling, projects})

  @doc """
  Triggers the image conversion of projects.
  Returns :ok, or :rejected, in case a task for any of the given projects is already running.
  """
  def convert(projects), do: GenServer.call(__MODULE__, {:convert, projects})

  def stop_tasks(projects), do: GenServer.call(__MODULE__, {:stop_tasks, projects})

  def show_tasks(), do: GenServer.call(__MODULE__, {:show_tasks})

  ##########################################################

  def start_link(opts) do
    Logger.debug "Start #{__MODULE__}"
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok), do: {:ok, _tasks = %{}} # tasks of running indexing processes with project names as keys

  # TODO handle projects not found, with :reindex and :stop_reindex
  @impl true
  def handle_call({:reindex, projects}, _from, tasks) do
    create_tasks(projects, tasks, :reindex)
  end
  def handle_call({:tiling, projects}, _from, tasks) do
    create_tasks(projects, tasks, :tiling)
  end
  def handle_call({:convert, projects}, _from, tasks) do
    create_tasks(projects, tasks, :convert)
  end
  def handle_call({:show_tasks}, _from, tasks) do
    {
      :reply,
      {
        :ok,
        Enum.map(Map.keys(tasks), display(tasks))
      },
      tasks
    }
  end
  def handle_call({:stop_tasks, projects}, _from, tasks) do

    projects = 
      projects 
      |> Enum.filter(fn project -> tasks[project] != nil end)
      |> Enum.map(fn project -> 
        pid = tasks[project].task.pid
        Process.exit pid, :killed_by_user
        Indexer.stop_reindex project # TODO Review timing; deletion of index after process killed; an existing working index must never be allowed to get deleted by accident
        Logger.info "Task stopped by admin. Did not finish task for '#{project}'"
        project
      end)

    if projects !== [] do
      {
        :reply,
        {
          :ok,
          "Stopped tasks for #{Enum.join(projects, ", ")}"
        },
        %{}
      }
    else 
      {
        :reply,
        {
          :ignored,
          "No task running"
        },
        tasks
      }
    end
  end

  @impl true
  def handle_info({_, {:finished, project}}, tasks) do
    {
      :noreply, 
      Map.delete(tasks, project)
    }
  end
  def handle_info({:DOWN, _ref, :process, _pid, :normal}, tasks), do: {:noreply, tasks}
  def handle_info({:DOWN, _ref, :process, _pid, :killed_by_user}, tasks), do: {:noreply, tasks}
  def handle_info({:DOWN, ref, :process, _pid, _error}, tasks) do

    case Enum.find(Map.to_list(tasks), fn {_, %{ task: %{ ref: r }}} -> r == ref end) do
      {project, _task} -> 
        Logger.error "Something went wrong. Could not finish task for '#{project}'"
        {
          :noreply, 
          Map.delete(tasks, project)
        }
      nil -> 
        Logger.error "Something went wrong. Could not finish reindexing"
        Logger.error "Could not find process handle for reference '#{inspect ref}'"
        {
          :noreply, 
          tasks
        }
    end
  end
  def handle_info(msg, tasks) do
    Logger.error "Something went wrong #{inspect msg}"
    {
      :noreply,
      tasks
    }
  end

  defp create_tasks(projects, tasks, type) do

    conflicts = MapSet.intersection(
      MapSet.new(projects), 
      MapSet.new(Map.keys(tasks)))
      |> MapSet.to_list

    if Enum.count(conflicts) > 0 do
      conflicts = conflicts
        |> Enum.map(display(tasks))
        |> Enum.map(&("'" <> &1 <> "'"))
        |> Enum.join(", ")
      {
        :reply,
        {
          :rejected, 
          "Other tasks still running. Conflicts: #{conflicts}"
        },
        tasks
      }
    else
      new_tasks = start_processes(projects, type)
      { 
        :reply,
        {
          :ok, 
          "Start task for #{Enum.join(projects, ", ")}"
        },
        Map.merge(tasks, new_tasks)
      }    
    end
  end

  defp start_processes(projects, type) do
    for project <- projects, into: %{} do
      { 
        project,
        %{ task: start_process(project, type), type: type}
      }
    end
  end

  defp start_process(project, :reindex) do
    Task.Supervisor.async_nolink(IndexingSupervisor, Indexer, :reindex, [project])
  end
  defp start_process(project, :tiling) do
    Task.Supervisor.async_nolink(IndexingSupervisor, TilesController, :make_tiles, [project])
  end
  defp start_process(project, :convert) do
    Task.Supervisor.async_nolink(IndexingSupervisor, ConversionController, :convert, [project])
  end

  defp display(tasks) do
    fn task_name -> "#{task_name}[#{Atom.to_string(tasks[task_name].type)}]" end
  end
end
