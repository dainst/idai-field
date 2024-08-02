defmodule FieldPublicationWeb.Router do
  use FieldPublicationWeb, :router

  alias FieldPublicationWeb.Cantaloupe

  import FieldPublicationWeb.UserAuth
  import FieldPublicationWeb.Gettext.Plug

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {FieldPublicationWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
    plug :fetch_locale
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api/image" do
    pipe_through :fetch_session
    pipe_through :fetch_current_user
    pipe_through :ensure_image_published

    scope "/iiif" do
      pipe_through :forward_headers

      forward("/", ReverseProxyPlug,
        status_callbacks: %{
          404 => &Cantaloupe.handle_404/2
        },
        upstream: &Cantaloupe.url/0,
        preserve_host_header: true
      )
    end

    get "/raw/:project_name/:uuid", FieldPublicationWeb.Api.Image, :raw
    get "/tile/:project_name/:uuid/:z/:x/:y", FieldPublicationWeb.Api.Image, :tile
  end

  scope "/api/json" do
    get "/raw/:project_name/:draft_date/:uuid", FieldPublicationWeb.Api.JSON, :raw
  end

  # If user is already logged but tries to access '/log_in' we redirects to the user's
  # last known route or fall back on '/'.
  scope "/", FieldPublicationWeb do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    live_session :redirect_if_user_is_authenticated,
      on_mount: [{FieldPublicationWeb.UserAuth, :redirect_if_user_is_authenticated}] do
      live "/log_in", UserLoginLive, :new
    end

    post "/log_in", UserSessionController, :create
  end

  # Routes that require an already logged in user.
  scope "/", FieldPublicationWeb do
    pipe_through [:browser, :require_authenticated_user]

    live_session :require_authenticated_user,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_authenticated}] do
      live "/management", Management.OverviewLive, :index
    end
  end

  # Routes that require the admin user to be logged in.
  scope "/management", FieldPublicationWeb do
    pipe_through [:browser, :require_administrator]

    live_session :require_administrator,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_authenticated}] do
      live "/users", Management.UserLive, :index
      live "/users/new", Management.UserLive, :new
      live "/users/:name/edit", Management.UserLive, :edit

      live "/projects/new", Management.OverviewLive, :new_project
      live "/projects/:project_id/edit", Management.OverviewLive, :edit_project
    end
  end

  # Routes that require a user with access to a specific project
  scope "/management", FieldPublicationWeb do
    pipe_through [:browser, :require_project_access]

    live_session :require_project_access,
      on_mount: [
        {FieldPublicationWeb.UserAuth, :ensure_authenticated},
        {FieldPublicationWeb.UserAuth, :ensure_has_project_access}
      ] do
      live "/projects/:project_id/publication/new",
           Management.OverviewLive,
           :new_publication

      live "/projects/:project_id/publication/:draft_date", Management.PublicationLive.Show
    end
  end

  scope "/projects", FieldPublicationWeb do
    pipe_through [:browser, :require_published_or_project_access]

    live_session :require_published_or_project_access,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_project_published_or_project_access}] do
      live "/:project_id/:draft_date/:language/hierarchy/:uuid",
           Presentation.HierarchyLive

      live "/:project_id", Presentation.DocumentLive
      live "/:project_id/:draft_date/:language", Presentation.DocumentLive
      live "/:project_id/:draft_date/:language/:uuid", Presentation.DocumentLive
    end
  end

  # Routes without authentication required.
  scope "/", FieldPublicationWeb do
    pipe_through [:browser]

    get "/select_locale", UILanguageController, :selection
    delete "/log_out", UserSessionController, :delete

    live_session :mount_user,
      on_mount: [{FieldPublicationWeb.UserAuth, :mount_current_user}] do
      live "/", Presentation.HomeLive
      live "/search", Presentation.SearchLive
    end
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:field_publication, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: FieldPublicationWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
