defmodule Api.Application do
  require Logger

  use Application

  def start(_type, _args) do

    Logger.info "Starting iDAI.field backend #{inspect Mix.env()}"

    children = [
      Api.Router,
      %{
        id: Api.Core.ProjectConfigLoader,
        start: {
          Api.Core.ProjectConfigLoader,
          :start_link,
          [
            {
              Api.Core.Config.get(:projects) ++ ["default"]
            }
          ]
        }
      },
      Api.Worker.Supervisor
    ]
    opts = [strategy: :one_for_one, name: Api.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
