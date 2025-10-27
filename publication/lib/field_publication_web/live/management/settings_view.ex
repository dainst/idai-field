defmodule FieldPublicationWeb.Management.SettingsView do
  alias FieldPublication.DatabaseSchema.ApplicationSettings
  alias FieldPublication.Settings
  alias Phoenix.HTML
  use FieldPublicationWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <.document_heading>Settings</.document_heading>

    <.image_settings {assigns} />
    <.color_settings {assigns} />
    <.page_name_setting {assigns} />
    <.imprint {assigns} />
    """
  end

  def image_settings(assigns) do
    ~H"""
    <section class="w-full">
      <.group_heading>Logo and favicon</.group_heading>
      <div :if={Enum.count(@existing_images) != 0}>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <%= for {file_name, info} <- @existing_images do %>
            <div class="bg-gray-100 p-4">
              <div class="mb-2 font-thin text-center">{file_name}</div>
              <%= case info do %>
                <% {:svg, binary_data} -> %>
                  <div class="max-h-16 w-full object-contain">
                    {HTML.raw(binary_data)}
                  </div>
                <% :img -> %>
                  <img class="max-h-16 w-full object-contain" src={~p"/custom/images/#{file_name}"} />
              <% end %>
              <div class="pt-4">
                <div
                  class="text-(--primary-color) hover:text-(--primary-color-hover) cursor-pointer"
                  phx-click="set"
                  phx-value-name={file_name}
                  phx-value-type="logo"
                >
                  {if file_name == @used_logo, do: "Remove", else: "Set"} as logo
                </div>

                <div
                  class="text-(--primary-color) hover:text-(--primary-color-hover) cursor-pointer"
                  phx-click="set"
                  phx-value-name={file_name}
                  phx-value-type="favicon"
                >
                  {if file_name == @used_favicon, do: "Remove", else: "Set"} as favicon
                </div>

                <div
                  class="basis-1/2 text-red-600 hover:text-red-800 cursor-pointer"
                  phx-click={JS.push("delete", value: %{name: file_name})}
                  data-confirm={"Are you sure you want to delete '#{file_name}'?"}
                >
                  Delete
                </div>
              </div>
            </div>
          <% end %>
        </div>
      </div>

      <div class="p-4 mt-4 bg-gray-100" phx-drop-target={@uploads.images.ref}>
        <form id="upload-form" phx-submit="save" phx-change="validate">
          <div>
            <.live_file_input upload={@uploads.images} />
          </div>
          <article :for={entry <- @uploads.images.entries} class="upload-entry">
            <figure>
              <.live_img_preview class="p-4 max-h-16" entry={entry} />
              <figcaption>{entry.client_name}</figcaption>
            </figure>

            <progress value={entry.progress} max="100">{entry.progress}%</progress>

            <button
              type="button"
              phx-click="cancel-upload"
              phx-value-ref={entry.ref}
              aria-label="cancel"
            >
              &times;
            </button>

            <%!-- Phoenix.Component.upload_errors/2 returns a list of error atoms --%>
            <p :for={err <- upload_errors(@uploads.images, entry)} class="alert alert-danger">
              {error_to_string(err)}
            </p>
          </article>

          <%= if @uploads.images.entries != [] do %>
            <.button class="mt-1" type="submit">Upload selected images</.button>
          <% end %>
        </form>

        <%!-- Phoenix.Component.upload_errors/1 returns a list of error atoms --%>
        <p :for={err <- upload_errors(@uploads.images)} class="alert alert-danger">
          {error_to_string(err)}
        </p>
      </div>
    </section>
    """
  end

  def color_settings(assigns) do
    ~H"""
    <section class="w-full">
      <.group_heading>Color scheme</.group_heading>

      <div class="flex mt-4">
        <form class="flex flex-col gap-2 basis-1/2" phx-change="validate" phx-submit="save">
          <label for="primary-color">Primary</label>
          <input type="color" id="primary-color" name="primary-color" value={@selected_primary_color} />

          <label for="primary-color">Primary (focussed)</label>
          <input
            type="color"
            id="primary-color-hover"
            name="primary-color-hover"
            value={@selected_primary_color_hover}
          />

          <label for="primary-color">Primary inverse</label>
          <input
            type="color"
            id="primary-color-inverse"
            name="primary-color-inverse"
            value={@selected_primary_color_inverse}
          />

          <label for="primary-color">Primary inverse (focussed)</label>
          <input
            type="color"
            id="primary-color-inverse-hover"
            name="primary-color-inverse-hover"
            value={@selected_primary_color_inverse_hover}
          />

          <div class="mt-4">
            <.button>Save</.button>
            <button
              class="p-2 border border-black cursor-pointer hover:bg-gray-100"
              type="button"
              phx-click={JS.push("reset-colors")}
              data-confirm="Are you sure you?"
            >
              Reset to defaults
            </button>
          </div>
        </form>

        <div class="ml-2 p-2 bg-gray-100 border border-black basis-1/2">
          <div class="text-lg mb-8">Preview</div>
          <style>
            .example_link {
              color:  <%= @selected_primary_color %>;
            }

            .example_link:hover {
              color:  <%= @selected_primary_color_hover %>;
            }

            .example_button {
              background-color:  <%= @selected_primary_color %>;
              color: <%= @selected_primary_color_inverse %>;
            }

            .example_button:hover {
              background-color:  <%= @selected_primary_color_hover %>;
              color: <%= @selected_primary_color_inverse_hover %>;
            }
          </style>
          <a class="cursor-pointer example_link">
            Example link
          </a>

          <div class="rounded p-2 mt-2 cursor-pointer example_button">
            Example button
          </div>
        </div>
      </div>
    </section>
    """
  end

  def page_name_setting(assigns) do
    ~H"""
    <section>
      <.group_heading>Page name</.group_heading>

      <form class="mt-4" phx-submit="save">
        <input class="border p-2" type="text" id="page_name" name="page_name" value={@used_page_name} />

        <.button>Save</.button>
      </form>
    </section>
    """
  end

  def imprint(assigns) do
    ~H"""
    """
  end

  @impl Phoenix.LiveView
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      |> check_used()
      |> assign(:existing_images, Settings.list_images())
      |> assign(:uploaded_files, [])
      |> allow_upload(:images, accept: ~w(.jpg .jpeg .svg .webp .png), max_entries: 10)
    }
  end

  @impl Phoenix.LiveView
  def handle_event(
        "validate",
        %{
          "primary-color" => primary_color,
          "primary-color-hover" => primary_hover,
          "primary-color-inverse" => primary_inverse,
          "primary-color-inverse-hover" => primary_inverse_hover
        },
        socket
      ) do
    {
      :noreply,
      socket
      |> assign(:selected_primary_color, primary_color)
      |> assign(:selected_primary_color_hover, primary_hover)
      |> assign(:selected_primary_color_inverse, primary_inverse)
      |> assign(:selected_primary_color_inverse_hover, primary_inverse_hover)
    }
  end

  def handle_event("validate", _params, socket) do
    {:noreply, socket}
  end

  def handle_event("cancel-upload", %{"ref" => ref}, socket) do
    {:noreply, cancel_upload(socket, :logo, ref)}
  end

  def handle_event(
        "save",
        %{
          "primary-color" => primary,
          "primary-color-hover" => primary_hover,
          "primary-color-inverse" => primary_inverse,
          "primary-color-inverse-hover" => primary_inverse_hover
        },
        socket
      ) do
    Settings.update(%{
      color_scheme: %{
        primary: primary,
        primary_hover: primary_hover,
        primary_inverse: primary_inverse,
        primary_inverse_hover: primary_inverse_hover
      }
    })

    {
      :noreply,
      # Force a redirect event to the route we are currently on to reload. `push_navigate` will not work here
      # so we have to force a reconnect, new css style will only be loaded on the initial http mount.
      redirect(socket, to: ~p"/management/settings")
    }
  end

  def handle_event("save", %{"page_name" => page_name}, socket) do
    Settings.update(%{
      page_name: page_name
    })

    {
      # Force a redirect event to the route we are currently on to reload. `push_navigate` will not work here
      :noreply,
      # so we have to force a reconnect, page title will only be loaded
      # on the initial http mount.
      redirect(socket, to: ~p"/management/settings")
    }
  end

  def handle_event("save", _params, socket) do
    uploaded_files =
      consume_uploaded_entries(socket, :images, fn %{path: path}, entry ->
        Settings.save_image(path, entry.client_name)
        {:ok, ~p"/custom/images/#{entry.client_name}"}
      end)

    {
      :noreply,
      socket
      |> update(:uploaded_files, &(&1 ++ uploaded_files))
      |> assign(:existing_images, Settings.list_images())
    }
  end

  def handle_event(
        "set",
        %{"name" => name, "type" => "logo"},
        %{assigns: %{used_logo: used}} = socket
      ) do
    setting_value =
      if used == name do
        nil
      else
        name
      end

    Settings.update(%{logo: setting_value})

    {
      :noreply,
      # Force a navigate event to the route we are currently on to reload.
      push_navigate(socket, to: ~p"/management/settings")
    }
  end

  def handle_event(
        "set",
        %{"name" => name, "type" => "favicon"},
        %{assigns: %{used_favicon: used}} = socket
      ) do
    setting_value =
      if used == name do
        nil
      else
        name
      end

    Settings.update(%{favicon: setting_value})

    {
      :noreply,
      # Force a redirect event to the route we are currently on to reload. `push_navigate` will not work here
      # so we have to force a reconnect, because the icon is only loaded on initial connection.
      redirect(socket, to: ~p"/management/settings")
    }
  end

  def handle_event("reset-colors", _, socket) do
    Settings.update(%{
      color_scheme: %{
        primary: nil,
        primary_hover: nil,
        primary_inverse: nil,
        primary_inverse_hover: nil
      }
    })

    {
      :noreply,
      # Force a redirect event to the route we are currently on to reload. `push_navigate` will not work here
      # so we have to force a reconnect, new css style will only be loaded on the initial html load.
      redirect(socket, to: ~p"/management/settings")
    }
  end

  def handle_event("delete", %{"name" => name}, socket) do
    Settings.delete_image_file(name)

    {
      :noreply,
      # Force a redirect to the route we are currently on to reload (this is could
      # be implemented more specific only for cases where `name` was the currently set favicon or logo.
      redirect(socket, to: ~p"/management/settings")
    }
  end

  defp error_to_string(:too_large), do: "Too large"
  defp error_to_string(:too_many_files), do: "You have selected too many files"
  defp error_to_string(:not_accepted), do: "You have selected an unacceptable file type"

  defp check_used(socket) do
    %ApplicationSettings{logo: logo, favicon: favicon} = settings = Settings.get_settings()

    socket
    |> assign(:used_logo, logo)
    |> assign(:used_favicon, favicon)
    |> assign(:current_settings, settings)
    |> assign(:selected_primary_color, settings.color_scheme.primary)
    |> assign(:selected_primary_color_hover, settings.color_scheme.primary_hover)
    |> assign(:selected_primary_color_inverse, settings.color_scheme.primary_inverse)
    |> assign(:selected_primary_color_inverse_hover, settings.color_scheme.primary_inverse_hover)
    |> assign(:used_page_name, settings.page_name)
  end
end
