defmodule FieldHubWeb.Router do
  use FieldHubWeb, :router

  alias FieldHub.CouchService
  import FieldHubWeb.UserAuth
  import Phoenix.LiveView.Router

  pipeline :browser do
    plug Plug.Parsers,
      parsers: [:urlencoded, :multipart, :json],
      pass: ["*/*"],
      json_decoder: Phoenix.json_library()

    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {FieldHubWeb.LayoutView, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api do
    plug Plug.Parsers,
      parsers: [:urlencoded, :multipart, :json],
      pass: ["*/*"],
      json_decoder: Phoenix.json_library()

    plug :accepts, ["json"]
  end

  forward "/db", ReverseProxyPlug, upstream: &CouchService.base_url/0

  scope "/", FieldHubWeb do
    pipe_through :browser

    get "/", PageController, :index

    get "/session/new", UserSessionController, :new
    post "/session/login", UserSessionController, :create
    post "/session/logout", UserSessionController, :delete
  end

  scope "/", FieldHubWeb do
    pipe_through :browser
    pipe_through :require_authenticated_user
    pipe_through :require_project_access

    live "/monitoring/:project", MonitoringLive
  end

  scope "/", FieldHubWeb.Api do
    pipe_through :api
    pipe_through :api_require_authenticated_user

    get "/api/projects", ProjectController, :index
  end

  scope "/", FieldHubWeb.Api do
    pipe_through :api
    pipe_through :api_require_authenticated_user
    pipe_through :api_require_project_access

    get "/api/projects/:project", ProjectController, :show

    resources "/files/:project", FileController, only: [:index, :update, :show, :delete]
  end

  scope "/", FieldHubWeb.Api do
    pipe_through :api
    pipe_through :api_require_admin_user
    post "/api/projects/:project", ProjectController, :create
  end

  # Other scopes may use custom stacks.
  # scope "/api", FieldHubWeb do
  #   pipe_through :api
  # end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: FieldHubWeb.Telemetry
    end
  end

  # Enables the Swoosh mailbox preview in development.
  #
  # Note that preview only shows emails that were sent by the same
  # node running the Phoenix server.
  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
