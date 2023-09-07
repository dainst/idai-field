defmodule FieldPublicationWeb.Router do
  use FieldPublicationWeb, :router

  import FieldPublicationWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {FieldPublicationWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  # If user is already logged but tries to access '/log_in' we redirects to the user's
  # last known route or falls back on '/' .
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
      live "/", ProjectLive.Index, :index
      live "/new", ProjectLive.Index, :new

      live "/:id", ProjectLive.Show, :show

      live "/:project_id/publication/new", PublicationLive.NewDraft, :new
      live "/:project_id/publication/:draft_date/edit", ProjectLive.Show, :edit_publication
    end
  end

  # Routes that require the admin user to be logged in.
  scope "/", FieldPublicationWeb do
    pipe_through [:browser, :require_administrator]

    live_session :require_administrator,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_authenticated}] do

      live "/:id/edit", ProjectLive.Index, :edit
      live "/:id/show/edit", ProjectLive.Show, :edit

      live "/admin/users", AdminLive.UserManagement, :index
      live "/admin/users/new", AdminLive.UserManagement, :new
      live "/admin/users/:name/new_password", AdminLive.UserManagement, :new_password
      live "/admin/users/:name/delete", AdminLive.UserManagement, :delete
    end
  end

  # Routes without authentication required.
  scope "/", FieldPublicationWeb do
    pipe_through [:browser]

    delete "/log_out", UserSessionController, :delete
  end


  # Other scopes may use custom stacks.
  # scope "/api", FieldPublicationWeb do
  #   pipe_through :api
  # end

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
