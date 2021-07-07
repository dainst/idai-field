defmodule Api.Worker.Router do
  require Logger
  use Plug.Router
  import Api.RouterUtils, only: [send_json: 2]
  alias Api.Worker.IndexAdapter
  alias Api.Worker.Server
  alias Api.Core.Config

  plug :match
  plug Api.Auth.AdminRightsPlug
  plug :dispatch

  post "/update_mapping" do
    IndexAdapter.update_mapping_template()
    send_json(conn, %{ status: "ok", message: "Start updating mapping template"})
  end

  # 1. Updates the mapping template.
  # 2. Reindexes all projects.
  post "/reindex" do
    IndexAdapter.update_mapping_template()
    {status, msg} = Server.reindex(Config.get(:projects))
    send_json(conn, %{ status: status, message: msg })
  end

  # 1. Reindexes a single project.
  post "/reindex/:project" do
    {status, msg} = Server.reindex([project])
    send_json(conn, %{ status: status, message: msg })
  end
  
  post "/tasks/stop" do
    {status, msg} = Server.stop_tasks(Config.get(:projects))
    send_json(conn, %{ status: status, message: msg })
  end

  post "/tasks/stop/:project" do
    {status, msg} = Server.stop_tasks([project])
    send_json(conn, %{ status: status, message: msg })
  end
  
  get "/tasks/show" do
    {status, msg} = Server.show_tasks()
    send_json(conn, %{ status: status, message: msg })
  end

  # Prerequisite: Reindex
  post "/tiling" do
    {status, msg} = Server.tiling(Config.get(:projects))
    send_json(conn, %{ status: status, message: msg})
  end

  # Prerequisite: Project is indexed
  post "/tiling/:project" do
    {status, msg} = Server.tiling([project])
    send_json(conn, %{ status: status, message: msg })
  end

  post "/convert" do
    {status, msg} = Server.convert(Config.get(:projects))
    send_json(conn, %{ status: status, message: msg })
  end

  post "/convert/:project" do
    {status, msg} = Server.convert([project])
    send_json(conn, %{ status: status, message: msg })
  end
end
