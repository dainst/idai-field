defmodule Api.Worker.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    # Our configuration works such that
    # a failure of any of the indexing processes
    # gets handled in Worker.Server.handle_info.
    # A failure of Worker.Server leads to a shutdown
    # of all the running indexing processes. After which
    # a new Worker.Server gets spawned.
    children = [
      {Task.Supervisor, name: Api.Worker.IndexingSupervisor},
      {Api.Worker.Server, name: Api.Worker.Server}
    ]
    opts = [strategy: :one_for_all]
    Supervisor.init(children, opts)
  end
end
