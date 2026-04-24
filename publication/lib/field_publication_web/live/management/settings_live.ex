defmodule FieldPublicationWeb.Management.SettingsLive do
  alias FieldPublication.DatabaseSchema.{
    ApplicationSettings
  }

  import FieldPublicationWeb.Components.TranslationInput

  alias FieldPublication.Settings
  alias Ecto.Changeset
  alias Phoenix.HTML
  use FieldPublicationWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <.back navigate={~p"/management"}>{gettext("Back to management")}</.back>
    <.document_heading>Settings</.document_heading>

    <.form for={@setting_form} phx-submit="save" phx-change="validate">
      <.button class="w-full" disabled={@setting_form.source.changes == %{}}>
        Save changes
      </.button>
      
    <!-- Logo and favicon are not changed by this form, instead they have their own events
     that get triggered when clicking in the uploaded images panel below. -->
      <.input type="hidden" field={@setting_form[:logo]} />
      <.input type="hidden" field={@setting_form[:favicon]} />

      <section>
        <.group_heading>Page name</.group_heading>
        <.input type="text" field={@setting_form[:page_name]} />
      </section>

      <.color_scheme_settings {assigns} />

      <.translation_input
        field={@setting_form[:contact]}
        language_options={@imprint_options}
      >
        <:heading>Imprint</:heading>
        <:no_translations>You currently have no imprint.</:no_translations>
      </.translation_input>
    </.form>
    <.image_settings {assigns} />
    """
  end

  def color_scheme_settings(assigns) do
    ~H"""
    <section>
      <.group_heading>Color scheme</.group_heading>
      <.inputs_for :let={color_scheme} field={@setting_form[:color_scheme]}>
        <div class="flex">
          <div class="basis-1/2">
            <.input label="Primary" type="color" field={color_scheme[:primary]} />
            <.input label="Primary hover" type="color" field={color_scheme[:primary_hover]} />
            <.input label="Primary inverse" type="color" field={color_scheme[:primary_inverse]} />
            <.input
              label="Primary inverse hover"
              type="color"
              field={color_scheme[:primary_inverse_hover]}
            />
          </div>

          <div class="ml-2 p-2 bg-gray-100 border border-black basis-1/2">
            <div class="text-lg mb-8 font-thin">Preview</div>
            <style>
              .example_link {
                color:  <%= color_scheme[:primary].value %>;
              }

              .example_link:hover {
                color:  <%= color_scheme[:primary_hover].value %>;
              }

              .example_button {
                background-color:  <%= color_scheme[:primary].value %>;
                color: <%= color_scheme[:primary_inverse].value %>;
              }

              .example_button:hover {
                background-color:  <%= color_scheme[:primary_hover].value %>;
                color: <%= color_scheme[:primary_inverse_hover].value %>;
              }

              .bar-background{
                background-color: <%= color_scheme[:primary].value %>;
                color: <%= color_scheme[:primary_inverse].value %>;
              }

              .bar-progress {
                background-color: <%= color_scheme[:primary_hover].value %>;
              }
            </style>
            <a class="cursor-pointer example_link">
              Example link
            </a>

            <div class="rounded p-2 mt-2 cursor-pointer example_button">
              Example button
            </div>

            <div class="mt-2">
              Example progress bars
              <div class="flex flex-col gap-1">
                <.progress_bar count={0} max={100} />
                <.progress_bar count={25} max={100} />
                <.progress_bar count={50} max={100} />
                <.progress_bar count={100} max={100} />
              </div>
            </div>
          </div>
        </div>
      </.inputs_for>
    </section>
    """
  end

  def image_settings(assigns) do
    ~H"""
    <section class="w-full">
      <.group_heading>Images</.group_heading>
      <div class="p-4 mt-4 bg-gray-100" phx-drop-target={@uploads.images.ref}>
        <form id="upload-form" phx-submit="upload" phx-change="validate">
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
      <div :if={Enum.count(@existing_images) != 0}>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <%= for {file_name, info} <- @existing_images do %>
            <div class="bg-gray-100 p-4">
              <div class="mb-2 font-thin text-center">{file_name}</div>
              <%= case info do %>
                <% {:svg, binary_data} -> %>
                  <div class="object-contain">
                    {HTML.raw(binary_data)}
                  </div>
                <% :img -> %>
                  <img class="object-contain" src={~p"/custom/images/#{file_name}"} />
              <% end %>
              <div class="pt-4">
                <div
                  class="text-(--primary-color) hover:text-(--primary-color-hover) cursor-pointer"
                  phx-click="toggle"
                  phx-value-name={file_name}
                  phx-value-type="logo"
                >
                  {if file_name == Phoenix.HTML.Form.input_value(@setting_form, :logo),
                    do: "Remove",
                    else: "Set"} as logo
                </div>

                <div
                  class="text-(--primary-color) hover:text-(--primary-color-hover) cursor-pointer"
                  phx-click="toggle"
                  phx-value-name={file_name}
                  phx-value-type="favicon"
                >
                  {if file_name == Phoenix.HTML.Form.input_value(@setting_form, :favicon),
                    do: "Remove",
                    else: "Set"} as favicon
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
    </section>
    """
  end

  @impl Phoenix.LiveView
  def mount(_params, _session, socket) do
    changeset =
      Settings.get()
      |> ApplicationSettings.changeset()

    imprint_options =
      FieldPublicationWeb.Translate.get_locale_labels()
      |> Enum.map(fn {language_key, label} ->
        [key: label, value: language_key]
      end)

    {
      :ok,
      socket
      |> assign(
        :imprint_options,
        [[key: "Please select a language", value: nil]] ++ imprint_options
      )
      |> update_form(changeset)
      |> assign(:existing_images, Settings.list_images())
      |> assign(:uploaded_files, [])
      |> assign(:page_title, "Settings")
      |> allow_upload(:images, accept: ~w(.jpg .jpeg .svg .webp .png), max_entries: 10)
    }
  end

  @impl true
  def handle_event("validate", %{"application_settings" => params}, socket) do
    changeset =
      %ApplicationSettings{}
      |> ApplicationSettings.changeset(params)

    {
      :noreply,
      update_form(socket, changeset)
    }
  end

  def handle_event("validate", _params, socket) do
    {:noreply, socket}
  end

  def handle_event("save", %{"application_settings" => settings_params}, socket) do
    socket =
      Settings.update(settings_params)
      |> case do
        {:ok, _doc} ->
          # Force a redirect to the route we are currently on to reload (this is could
          # be implemented more specific only for cases where `name` was the currently set favicon or logo.
          redirect(socket, to: ~p"/management/settings")

        {:error, changeset} ->
          assign(socket, :setting_form, to_form(changeset))
      end

    {
      :noreply,
      socket
    }
  end

  def handle_event("cancel-upload", %{"ref" => ref}, socket) do
    {:noreply, cancel_upload(socket, :logo, ref)}
  end

  def handle_event("upload", _params, socket) do
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
        "toggle",
        %{"name" => name, "type" => "logo"},
        %{assigns: %{setting_form: %{source: form_changeset}}} = socket
      ) do
    new_value = if Changeset.get_field(form_changeset, :logo) == name, do: nil, else: name

    changeset =
      form_changeset
      |> ApplicationSettings.changeset(%{logo: new_value})

    {
      :noreply,
      update_form(socket, changeset)
    }
  end

  def handle_event(
        "toggle",
        %{"name" => name, "type" => "favicon"},
        %{assigns: %{setting_form: %{source: form_changeset}}} = socket
      ) do
    new_value = if Changeset.get_field(form_changeset, :favicon) == name, do: nil, else: name

    new_changeset = ApplicationSettings.changeset(form_changeset, %{favicon: new_value})

    {
      :noreply,
      update_form(socket, new_changeset)
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

  defp update_form(socket, changeset) do
    assign(socket, :setting_form, to_form(changeset))
  end
end
