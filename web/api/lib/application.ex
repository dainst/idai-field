defmodule Api.Application do
  require Logger

  use Application

  def port_available?() do
    case :gen_tcp.listen(Application.get_env(:api, :port), [:binary]) do
      {:ok, socket} ->
        :ok = :gen_tcp.close(socket)
        true
      {:error, :eaddrinuse} ->
        false
    end
  end

  def start(_type, _args) do

    children = [
      Api.Worker.Supervisor
    #   %{
    #     id: Api.Core.ProjectConfigLoader,
    #     start: {
    #       Api.Core.ProjectConfigLoader,
    #       :start_link,
    #       [
    #         {
    #           Api.Core.Config.get(:projects) ++ ["default"]
    #         }
    #       ]
    #     }
    #   },
    ]

    children =
      if port_available?() do
        # Do not use string interpolation here, otherwise we would get the configuration value at
        # compile- and not at runtime.
        port = Application.get_env(:api, :port) |> Integer.to_string()

        Logger.info "Starting API server on port " <> port <> "."
        children ++ [Api.Router]
      else
        children
      end

    opts = [strategy: :one_for_one, name: Api.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
