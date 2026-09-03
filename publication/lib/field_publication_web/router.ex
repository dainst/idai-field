defmodule FieldPublicationWeb.Router do
  use FieldPublicationWeb, :router

  import FieldPublicationWeb.UserAuth
  import FieldPublicationWeb.Gettext.Plug

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, html: {FieldPublicationWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
    plug(:fetch_current_user)
    plug(:fetch_locale)
  end

  pipeline :api do
    plug OpenApiSpex.Plug.PutApiSpec, module: FieldPublicationWeb.Api
    plug(:accepts, ["json", "jsonld", "webp", "jpeg", "png"])
  end

  scope "/api" do
    pipe_through(:fetch_session)
    pipe_through(:fetch_current_user)
    pipe_through(:api)

    scope "/iiif/image" do
      get("/v3/spec/info", FieldPublicationWeb.Api, :iiif_v3_info_spec)
      get("/v3/spec/data", FieldPublicationWeb.Api, :iiif_v3_data_spec)

      pipe_through(:ensure_image_access)
      forward("/v3", FieldPublicationWeb.Api.IIIFImage, %IIIFImagePlug.V3.Options{})
    end

    scope "/v1/:project_identifier/image/:uuid" do
      pipe_through(:ensure_image_access)
      get("/tile/:z/:x/:y", FieldPublicationWeb.Api.V1.Project, :zxy_tile)
      get("/", FieldPublicationWeb.Api.V1.Project, :raw_image)
    end

    scope "/v1/:project_identifier/:draft_date/doc" do
      pipe_through(:ensure_publication_access)

      get(
        "/:uuid/extended",
        FieldPublicationWeb.Api.V1.Publication,
        :extended_doc
      )

      get(
        "/:uuid",
        FieldPublicationWeb.Api.V1.Publication,
        :raw_doc
      )
    end

    scope "/v1/:project_identifier/:draft_date/geometry" do
      pipe_through(:ensure_publication_access)

      get("/", FieldPublicationWeb.Api.V1.Publication, :geo_collections)
    end

    scope "/v1/:project_identifier/:draft_date" do
      pipe_through(:ensure_publication_access)
      get("/", FieldPublicationWeb.Api.V1.Publication, :index)
    end

    scope "/v1" do
      #  get("/spec", FieldPublicationWeb.Api.V1, :spec)
      get("/", FieldPublicationWeb.Api.V1, :index)
    end

    get "/spec", OpenApiSpex.Plug.RenderSpec, []
  end

  # If user is already logged but tries to access '/log_in' we redirects to the user's
  # last known route or fall back on '/'.
  scope "/", FieldPublicationWeb do
    pipe_through([:browser, :redirect_if_user_is_authenticated])

    live_session :redirect_if_user_is_authenticated,
      on_mount: [{FieldPublicationWeb.UserAuth, :redirect_if_user_is_authenticated}] do
      live("/log_in", UserLoginLive, :new)
    end

    post("/log_in", UserSessionController, :create)
  end

  # Routes that require an already logged in user.
  scope "/", FieldPublicationWeb do
    pipe_through([:browser, :require_authenticated_user])

    live_session :require_authenticated_user,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_authenticated}] do
      live("/management", Management.OverviewLive, :index)
    end
  end

  # Routes that require the admin user to be logged in.
  scope "/management", FieldPublicationWeb do
    pipe_through([:browser, :require_administrator])

    live_session :require_administrator,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_is_admin}] do
      live("/users", Management.UserLive, :index)
      live("/users/new", Management.UserLive, :new)
      live("/users/:name/edit", Management.UserLive, :edit)

      live("/projects/new", Management.OverviewLive, :new_project)
      live("/projects/:project_identifier/edit", Management.OverviewLive, :edit_project)

      live("/settings", Management.SettingsLive)
    end
  end

  # Routes that require a user with access to a specific project
  scope "/management", FieldPublicationWeb do
    pipe_through([:browser, :ensure_project_access])

    live_session :ensure_project_access,
      on_mount: [
        {FieldPublicationWeb.UserAuth, :ensure_authenticated},
        {FieldPublicationWeb.UserAuth, :ensure_project_access}
      ] do
      live(
        "/projects/:project_identifier/publication/new",
        Management.OverviewLive,
        :new_publication
      )

      live("/projects/:project_identifier/publication/:draft_date", Management.PublicationLive)
    end
  end

  scope "/projects", FieldPublicationWeb do
    pipe_through([:browser, :ensure_publication_access])

    live_session :ensure_publication_access,
      on_mount: [{FieldPublicationWeb.UserAuth, :ensure_publication_access}] do
      live("/search/:project_identifier/:draft_date", Presentation.PublicationSearch)
      live("/:project_identifier", Presentation.DocumentLive)
      live("/:project_identifier/:draft_date", Presentation.DocumentLive)
      live("/:project_identifier/:draft_date/:uuid", Presentation.DocumentLive)

      live(
        "/:project_identifier/:draft_date/:uuid/map",
        Presentation.DocumentLive,
        :map_datasheet
      )

      live(
        "/:project_identifier/:draft_date/:uuid/map/hierarchy",
        Presentation.DocumentLive,
        :map_hierarchy
      )

      live(
        "/:project_identifier/:draft_date/:uuid/map/context",
        Presentation.DocumentLive,
        :map_context
      )
    end
  end

  # Routes without authentication required.
  scope "/" do
    pipe_through([:browser])

    # get "/api_info", OpenApiSpex.Plug.SwaggerUI,
    #   path: "/api/spec",
    #   title: "API Specification · Field Publication"

    get("/api_doc", FieldPublicationWeb.ApiDocControllerController, :show)
    get("/select_locale", FieldPublicationWeb.UILanguageController, :selection)
    delete("/log_out", FieldPublicationWeb.UserSessionController, :delete)

    live_session :mount_user,
      on_mount: [{FieldPublicationWeb.UserAuth, :mount_current_user}] do
      live("/imprint", FieldPublicationWeb.ContactAndImprintLive)
      live("/search", FieldPublicationWeb.Presentation.SearchLive)
      live("/", FieldPublicationWeb.Presentation.HomeLive)
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
      pipe_through(:browser)
      live("/field_render", FieldRenderHelper)

      live_dashboard("/dashboard", metrics: FieldPublicationWeb.Telemetry)
      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end
end
