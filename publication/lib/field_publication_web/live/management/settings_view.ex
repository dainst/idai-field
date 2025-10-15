defmodule FieldPublicationWeb.Management.SettingsView do
  alias FieldPublication.DatabaseSchema.ApplicationSettings
  alias FieldPublication.Settings
  alias Phoenix.HTML
  use FieldPublicationWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <.document_heading>Settings</.document_heading>

    <section class="w-full">
      <.image_settings {assigns} />
    </section>
    <section class="pt-4">
      <.color_settings {assigns} />
    </section>
    """
  end

  def image_settings(assigns) do
    ~H"""
    <.group_heading>Logo and favicon</.group_heading>
    <div :if={Enum.count(@existing_images) != 0}>
      <div class="grid grid-cols-3 gap-4">
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
      <form id="upload-form" phx-click="save" phx-change="validate">
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
    """
  end

  def color_settings(assigns) do
    ~H"""
    <.group_heading>Color scheme</.group_heading>

    <form phx-change="validate" phx-submit="set">
      <div>
        <input type="color" id="primary-color" name="primary-color" value={@selected_primary_color} />
        <label for="primary-color">Primary</label>
      </div>
      <div>
        <input
          type="color"
          id="primary-color-hover"
          name="primary-color-hover"
          value={@selected_primary_color_hover}
        />
        <label for="primary-color">Primary (focussed)</label>
      </div>

      <div>
        <input
          type="color"
          id="primary-color-inverse"
          name="primary-color-inverse"
          value={@selected_primary_color_inverse}
        />
        <label for="primary-color">Primary inverse</label>
      </div>

      <div>
        <input
          type="color"
          id="primary-color-inverse-hover"
          name="primary-color-inverse-hover"
          value={@selected_primary_color_inverse_hover}
        />
        <label for="primary-color">Primary inverse (focussed)</label>
      </div>

      <button>Set</button>
    </form>
    <button phx-click="reset-colors">Reset to defaults</button>

    <div>
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

  @impl Phoenix.LiveView
  def handle_event("cancel-upload", %{"ref" => ref}, socket) do
    {:noreply, cancel_upload(socket, :logo, ref)}
  end

  @impl Phoenix.LiveView
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

  def handle_event(
        "set",
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
      # so we have to force a reconnect, new css style will only be loaded on the initial html load.
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
  end
end
