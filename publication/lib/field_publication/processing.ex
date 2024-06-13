defmodule FieldPublication.Processing do
  use GenServer

  alias FieldPublication.Processing.MapTiles

  alias FieldPublication.Processing.{
    Image,
    OpenSearch
  }

  alias FieldPublication.DocumentSchema.Publication
  alias FieldPublication.Publications

  alias Phoenix.PubSub

  require Logger

  @moduledoc """
  This GenServer module starts, stops and tracks processing tasks.

  GenServers are a core building block in Elixir (or rather the whole Erlang ecosystem).
  Basically this defines a child process that gets started when the application is started
  (see application.ex) and waits for requests from other processes within the system.
  It holds an internal state (a list of running tasks) and provides some API functions
  that let other part sof the application start/stop or monitor the running tasks.

  See also https://hexdocs.pm/elixir/1.15.7/GenServer.htm

  Each item in the internal state is a tuple of the pattern `{task, processing_type, processing_context}`,
  where `task` is a reference to the Elixir Task that got initiated, processing_type is an atom that identifies the
  type of processing (for example `:web_images`) and `processing_context` identifies the context within FieldPublication
  that is being processed (for example the document id of a certain `FieldPublication.DocumentSchema.Publication`). The
  `processing_context` value is also used to broadcast PubSub messages.

  Use the API functions below to interact with the module.
  """

  def start_link(_opts) do
    Logger.debug("Starting Processing GenServer")
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    Logger.debug("Initializing Processing GenServer state to empty list")
    {:ok, []}
  end

  #########################################################################
  ## Start of API functions to be called from the rest of the application.

  @doc """
  Start all processing tasks for the given publication.
  """
  def start(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:start, publication, :web_images})
    GenServer.call(__MODULE__, {:start, publication, :tile_images})
    GenServer.call(__MODULE__, {:start, publication, :search_index})
  end

  @doc """
  Start a processing task as defined by `type` for the given publication.
  """
  def start(%Publication{} = publication, type)
      when type in [:web_images, :tile_images, :search_index] do
    # Extend the list of atoms in the guard above to support additional processing steps. You
    # still need to implement the  appropriate `handle_call/3` below.
    GenServer.call(__MODULE__, {:start, publication, type})
  end

  @doc """
  Get information about all currently running processing tasks.
  """
  def show() do
    GenServer.call(__MODULE__, :show)
  end

  @doc """
  Get information about all currently running processing tasks for the given publication.
  """
  def show(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:show, Publications.get_doc_id(publication)})
  end

  @doc """
  Get information about the currently running processing task as defined by `type` for the given publication.
  """
  def show(%Publication{} = publication, type)
      when type in [:web_images, :tile_images, :search_index] do
    GenServer.call(__MODULE__, {:show, Publications.get_doc_id(publication), type})
  end

  @doc """
  Stop all currently running processing tasks.
  """
  def stop() do
    GenServer.call(__MODULE__, :stop)
  end

  @doc """
  Stop all currently running processing tasks for the given publication.
  """
  def stop(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:stop, Publications.get_doc_id(publication)})
  end

  @doc """
  Stop the currently running processing task as defined by `type` for the given publication.
  """
  def stop(%Publication{} = publication, type)
      when type in [:web_images, :tile_images, :search_index] do
    GenServer.call(__MODULE__, {:stop, Publications.get_doc_id(publication), type})
  end

  # End of API function definitions. Everything below should __not__ get called directly from other modules.
  ###################################

  @doc """
  These `handle_call/3` implementations handle messages sent by other processes to
  the GenServer. These calls will in general originate from the API functions defined above or from the
  asynchronous tasks started by the GenServer itself (reporting that the processing task has finished/crashed...).
  """
  def handle_call({:start, %Publication{} = publication, :web_images}, _from, running_tasks) do
    publication_id = Publications.get_doc_id(publication)

    Enum.any?(running_tasks, fn {_task, type, context} ->
      publication_id == context and type == :web_images
    end)
    |> if do
      # The `:web_images` task is already running for the given publication, keep the state as-is and return a
      # `:already_running` atom to the caller.
      {:reply, :already_running, running_tasks}
    else
      # Start the `:web_images` task for the given publication, broadcast the event to the publication's PubSub channel,
      # update the state and return an `:ok` atom to the caller.
      task =
        Task.Supervisor.async_nolink(
          FieldPublication.ProcessingSupervisor,
          # Module that implements the actual processing.
          Image,
          # Function within that module to start the task.
          :start_web_image_processing,
          # Parameters for that function.
          [publication]
        )

      broadcast(publication_id, :web_images, :processing_started)

      {:reply, :ok, running_tasks ++ [{task, :web_images, publication_id}]}
    end
  end

  def handle_call({:start, %Publication{} = publication, :tile_images}, _from, running_tasks) do
    publication_id = Publications.get_doc_id(publication)

    Enum.any?(running_tasks, fn {_task, type, context} ->
      publication_id == context and type == :tile_images
    end)
    |> if do
      # The `:tile_images` task is already running for the given publication, keep the state as-is and return a
      # `:already_running` atom to the caller.
      {:reply, :already_running, running_tasks}
    else
      # Start the `:tile_images` task for the given publication, broadcast the event to the publication's PubSub channel,
      # update the state and return an `:ok` atom to the caller.
      task =
        Task.Supervisor.async_nolink(
          FieldPublication.ProcessingSupervisor,
          # Module that implements the actual processing.
          MapTiles,
          # Function within that module to start the processing.
          :start_tile_creation,
          # Parameters for that function.
          [publication]
        )

      broadcast(publication_id, :tile_images, :processing_started)

      {:reply, :ok, running_tasks ++ [{task, :tile_images, publication_id}]}
    end
  end

  def handle_call({:start, %Publication{} = publication, :search_index}, _from, running_tasks) do
    publication_id = Publications.get_doc_id(publication)

    Enum.any?(running_tasks, fn {_task, type, context} ->
      publication_id == context and type == :search_index
    end)
    |> if do
      # The `:search_index` task is already running for the given publication, keep the state as-is and return a
      # `:already_running` atom to the caller.
      {:reply, :already_running, running_tasks}
    else
      # Start the `:search_index` task for the given publication, broadcast the event to the publication's PubSub channel,
      # update the state and return an `:ok` atom to the caller.
      task =
        Task.Supervisor.async_nolink(
          FieldPublication.ProcessingSupervisor,
          # Module that implements the actual processing.
          OpenSearch,
          # Function within that module to start the processing.
          :index,
          # Parameters for that function.
          [publication]
        )

      broadcast(publication_id, :search_index, :processing_started)

      {:reply, :ok, running_tasks ++ [{task, :search_index, publication_id}]}
    end
  end

  def handle_call(:show, _from, running_tasks) do
    {:reply, running_tasks, running_tasks}
  end

  def handle_call({:show, requested_context}, _from, running_tasks) do
    requested_tasks =
      Enum.filter(running_tasks, fn {_task, _type, context} ->
        context == requested_context
      end)

    {:reply, requested_tasks, running_tasks}
  end

  def handle_call({:show, requested_context, requested_type}, _from, running_tasks) do
    requested_task =
      Enum.find(running_tasks, fn {_task, type, context} ->
        context == requested_context and type == requested_type
      end)

    {:reply, requested_task, running_tasks}
  end

  def handle_call(:stop, _from, running_tasks) do
    Logger.debug("Stopping all processing tasks.")

    Enum.each(running_tasks, fn {task, _type, _context} ->
      Process.exit(task.pid, :stopped)
    end)

    {:reply, :ok, running_tasks}
  end

  def handle_call({:stop, requested_context}, _from, running_tasks) do
    Logger.debug("Stopping all processing tasks for #{requested_context}.")

    {requested_tasks, _remaining_tasks} =
      Enum.split_with(running_tasks, fn {_task, _type, context} ->
        context == requested_context
      end)

    Enum.each(requested_tasks, fn {task, _type, _context} ->
      Process.exit(task.pid, :stopped)
    end)

    {:reply, :ok, running_tasks}
  end

  def handle_call({:stop, requested_context, requested_type}, _from, running_tasks) do
    Logger.debug("Stopping '#{requested_type}' processing task for #{requested_context}.")

    {[{task, _type, _context}], _remaining_tasks} =
      Enum.split_with(running_tasks, fn {_task, type, context} ->
        context == requested_context and type == requested_type
      end)

    Process.exit(task.pid, :stopped)

    {:reply, :ok, running_tasks}
  end

  # Handling of finished, stopped or crashed tasks

  def handle_info({_ref, _answer}, running_tasks) do
    # Handles successfull tasks, we currently do not extract data contained in the answer. Instead
    # we just reply with the running tasks and let the appropriate {:DOWN, _, _, _,} message update the
    # internal state, see below.
    {:noreply, running_tasks}
  end

  def handle_info({:DOWN, ref, :process, _pid, :normal}, running_tasks) do
    Logger.debug("A processing task has completed successfully.")
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
