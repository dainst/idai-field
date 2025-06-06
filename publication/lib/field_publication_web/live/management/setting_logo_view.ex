defmodule FieldPublicationWeb.Management.SettingLogoView do
  alias FieldPublication.Settings
  alias Phoenix.HTML
  use FieldPublicationWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <.document_heading>Visual customization</.document_heading>
    <div class="flex">
      <section class="basis-1/2">
        <.group_heading>Set logo and favicon</.group_heading>
        <div :if={Enum.count(@existing) != 0}>
          <div class="grid grid-cols-3 gap-4">
            <%= for {file_name, info} <- @existing do %>
              <div class="bg-gray-100 p-4">
                <%= case info do %>
                  <% {:svg, binary_data} -> %>
                    <div class="max-h-16  w-full object-contain">
                      {HTML.raw(binary_data)}
                    </div>
                  <% :img -> %>
                    <img class="max-h-16  w-full object-contain" src={~p"/uploads/#{file_name}"} />
                <% end %>
                <div>
                  <div class="mb-2 font-thin">{file_name}</div>
                  <div
                    class="basis-1/2 text-(--primary-color) hover:text-(--primary-color-hover) cursor-pointer"
                    phx-click="set"
                    phx-value-name={file_name}
                    phx-value-type="logo"
                  >
                    {if file_name == @used_logo, do: "Remove", else: "Set"} as logo
                  </div>

                  <div
                    class="basis-1/2 text-(--primary-color) hover:text-(--primary-color-hover) cursor-pointer"
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

        <div class="p-4 mt-4 bg-gray-100" phx-drop-target={@uploads.logo.ref}>
          <form id="upload-form" phx-submit="save" phx-change="validate">
            <div>
              <.live_file_input upload={@uploads.logo} />
            </div>
            <.button class="mt-1" type="submit">Upload</.button>
          </form>

          <article :for={entry <- @uploads.logo.entries} class="upload-entry">
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
            <p :for={err <- upload_errors(@uploads.logo, entry)} class="alert alert-danger">
              {error_to_string(err)}
            </p>
          </article>

          <%!-- Phoenix.Component.upload_errors/1 returns a list of error atoms --%>
          <p :for={err <- upload_errors(@uploads.logo)} class="alert alert-danger">
            {error_to_string(err)}
          </p>
        </div>
      </section>
    </div>
    """
  end

  @impl Phoenix.LiveView
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      |> check_used()
      |> assign(:existing, Settings.list_logos())
      |> assign(:uploaded_files, [])
      |> allow_upload(:logo, accept: ~w(.jpg .jpeg .svg .webp .png), max_entries: 10)
    }
  end

  @impl Phoenix.LiveView
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
      consume_uploaded_entries(socket, :logo, fn %{path: path}, entry ->
        Settings.save_logo_file(path, entry.client_name)
        {:ok, ~p"/uploads/#{entry.client_name}"}
      end)

    {
      :noreply,
      socket
      |> update(:uploaded_files, &(&1 ++ uploaded_files))
      |> assign(:existing, Settings.list_logos())
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

    Settings.update(:logo, setting_value)

    {
      :noreply,
      # Force a navigate event to the route we are currently on to reload.
      push_navigate(socket, to: ~p"/management/settings/logo")
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

    Settings.update(:favicon, setting_value)

    {
      :noreply,
      # Force a redirect event to the route we are currently on to reload. `push_navigate` will not work here
      # so we have to force a reconnect, because the icon is only loaded on initial connection.
      redirect(socket, to: ~p"/management/settings/logo")
    }
  end

  def handle_event("delete", %{"name" => name}, socket) do
    Settings.delete_logo_file(name)

    {
      :noreply,
      # Force a redirect to the route we are currently on to reload (this is could
      # be implemented more specific only for cases where `name` was the currently set favicon or logo.
      redirect(socket, to: ~p"/management/settings/logo")
    }
  end

  defp error_to_string(:too_large), do: "Too large"
  defp error_to_string(:too_many_files), do: "You have selected too many files"
  defp error_to_string(:not_accepted), do: "You have selected an unacceptable file type"

  defp check_used(socket) do
    socket
    |> assign(:used_logo, Settings.get_setting(:logo))
    |> assign(:used_favicon, Settings.get_setting(:favicon))
  end
end
