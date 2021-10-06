defmodule IdaiFieldServerWeb.Router do
  use IdaiFieldServerWeb, :router

  import IdaiFieldServerWeb.ProjectAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_project
  end

  pipeline :api do
    plug :accepts, ["json"]

    get "/sync/*rest", IdaiFieldServerWeb.CouchDBController, :sync
  end

  scope "/", IdaiFieldServerWeb do
    pipe_through :browser

    get "/", PageController, :index
  end

  scope "/files", IdaiFieldServerWeb do
    get "/:project/*filepath", FilesController, :download
    post "/:project/*filepath", FilesController, :upload
  end

  # Other scopes may use custom stacks.
  # scope "/api", IdaiFieldServerWeb do
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
      live_dashboard "/dashboard", metrics: IdaiFieldServerWeb.Telemetry
    end
  end

  ## Authentication routes

  scope "/", IdaiFieldServerWeb do
    pipe_through [:browser, :redirect_if_project_is_authenticated]

    get "/projects/register", ProjectRegistrationController, :new
    post "/projects/register", ProjectRegistrationController, :create
    get "/projects/log_in", ProjectSessionController, :new
    post "/projects/log_in", ProjectSessionController, :create
    get "/projects/reset_password", ProjectResetPasswordController, :new
    post "/projects/reset_password", ProjectResetPasswordController, :create
    get "/projects/reset_password/:token", ProjectResetPasswordController, :edit
    put "/projects/reset_password/:token", ProjectResetPasswordController, :update
  end

  scope "/", IdaiFieldServerWeb do
    pipe_through [:browser, :require_authenticated_project]

    get "/projects/settings", ProjectSettingsController, :edit
    put "/projects/settings/update_password", ProjectSettingsController, :update_password
    put "/projects/settings/update_email", ProjectSettingsController, :update_email
    get "/projects/settings/confirm_email/:token", ProjectSettingsController, :confirm_email
  end

  scope "/", IdaiFieldServerWeb do
    pipe_through [:browser]

    delete "/projects/log_out", ProjectSessionController, :delete
    get "/projects/confirm", ProjectConfirmationController, :new
    post "/projects/confirm", ProjectConfirmationController, :create
    get "/projects/confirm/:token", ProjectConfirmationController, :confirm
  end
end
