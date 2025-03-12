defmodule FieldHubWeb.Router do
  use FieldHubWeb, :router

  import FieldHubWeb.UserAuth

  alias FieldHub.CouchService

  pipeline :browser do
    # Moved Plug.Parsers from endpoint.ex (which is the Phoenix default) because of
    # https://hexdocs.pm/reverse_proxy_plug/3.0.0/readme.html#usage-in-phoenix
    plug Plug.Parsers,
      parsers: [:urlencoded, :multipart, :json],
      pass: ["*/*"],
      json_decoder: Phoenix.json_library()

    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {FieldHubWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  forward "/db", ReverseProxyPlug, upstream: &CouchService.base_url/0

  scope "/ui/session" do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    live_session :redirect_if_user_is_authenticated,
      on_mount: [{FieldHubWeb.UserAuth, :redirect_if_user_is_authenticated}] do
      live "/log_in", FieldHubWeb.UI.UserLoginLive, :new
    end

    post "/log_in", FieldHubWeb.UserSessionController, :create
  end

  scope "/" do
    pipe_through :browser

    live_session :current_user,
      on_mount: [{FieldHubWeb.UserAuth, :mount_current_user}] do
      live "/", FieldHubWeb.UI.ProjectList
    end

    # get "/", PageController, :index
  end

  scope "/ui", FieldHubWeb do
    pipe_through :browser

    scope "/projects" do
      pipe_through :ui_require_user_authentication

      scope "/show/:project" do
        pipe_through :ui_require_project_authorization

        live "/", ProjectShowLive
      end

      scope "/create" do
        pipe_through :ui_require_admin

        live "/", ProjectCreateLive
      end
    end
  end

  scope "/ui/session" do
    pipe_through [:browser]

    get "/log_out", FieldHubWeb.UserSessionController, :delete
  end

  # API Routes
  scope "/", FieldHubWeb.Api do
    pipe_through :api
    pipe_through :api_require_user_authentication

    get "/projects", ProjectController, :index

    scope "/" do
      pipe_through :api_require_project_authorization

      get "/projects/:project", ProjectController, :show
      resources "/files/:project", FileController, only: [:index, :update, :show, :delete]
    end

    scope "/" do
      pipe_through :api_require_admin
      post "/projects/:project", ProjectController, :create
      delete "/projects/:project", ProjectController, :delete
    end
  end

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
end
