defmodule IdaiFieldServerWeb.Router do
  use IdaiFieldServerWeb, :router

  import IdaiFieldServerWeb.UserAuth


  pipeline :browser do
    plug Plug.Parsers,
      parsers: [:urlencoded, :multipart, :json],
      pass: ["*/*"],
      json_decoder: Phoenix.json_library()

    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  scope "/sync" do
    repo_env = Application.fetch_env! :idai_field_server, IdaiFieldServer.Repo
    repo_env = Enum.into repo_env, %{}
    couchdb_path = repo_env.couchdb

    # With the current endpoint.ex, log in into Fauxton does not work.
    # We won't fix it at the moment, because it seems a better idea to leave access to Fauxton be done
    # via its own url, especially since we provide database management functionalities here, too.
    get "/_utils", ForbiddenController, :forbid

    forward "/", ReverseProxyPlug, upstream: "//#{couchdb_path}/"
  end

  # Currently this is the most important thing we use of the Phoenix Application.
  # It is a (proof of concept of a) simple API for storing, retrieving and deleting files.
  # The authentication and authorization is based on couchdb users and databases.
  # If the given credentials suffice to access the corresponding couchdb, permissions
  # will be granted to access the files storage for that project.
  #
  scope "/files", IdaiFieldServerWeb do
    # pipe_through :api
    get "/:project/*filepath", FilesController, :download
    post "/:project/*filepath", FilesController, :upload
    delete "/:project/*filepath", FilesController, :delete
  end

  # Phoenix landing page of the web app
  scope "/", IdaiFieldServerWeb do
    pipe_through :browser
    get "/", PageController, :index
  end

  # Authentication routes
  # Everything from here as well as a couple of artifacts have been generated
  # via `mix phx.gen.auth`.
  scope "/", IdaiFieldServerWeb do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    get "/users/register", UserRegistrationController, :new
    post "/users/register", UserRegistrationController, :create
    get "/users/log_in", UserSessionController, :new
    post "/users/log_in", UserSessionController, :create
    get "/users/reset_password", UserResetPasswordController, :new
    post "/users/reset_password", UserResetPasswordController, :create
    get "/users/reset_password/:token", UserResetPasswordController, :edit
    put "/users/reset_password/:token", UserResetPasswordController, :update
  end

  scope "/", IdaiFieldServerWeb do
    pipe_through [:browser, :require_authenticated_user]

    get "/databases", DatabasesController, :index
    get "/databases/new", DatabasesController, :new
    post "/databases/create", DatabasesController, :create
    post "/databases/delete", DatabasesController, :delete
    get "/databases/:name", DatabasesController, :edit

    get "/users/settings", UserSettingsController, :edit
    put "/users/settings/update_password", UserSettingsController, :update_password
    put "/users/settings/update_email", UserSettingsController, :update_email
    get "/users/settings/confirm_email/:token", UserSettingsController, :confirm_email
  end

  scope "/", IdaiFieldServerWeb do
    pipe_through [:browser]

    delete "/users/log_out", UserSessionController, :delete
    get "/users/confirm", UserConfirmationController, :new
    post "/users/confirm", UserConfirmationController, :create
    get "/users/confirm/:token", UserConfirmationController, :confirm
  end
end
