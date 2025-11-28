defmodule FieldPublicationWeb.ContactAndImprintLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Settings

  alias FieldPublication.DatabaseSchema.{
    ApplicationSettings,
    Translation
  }

  def render(assigns) do
    ~H"""
    <%= if @contact != nil do %>
      <div class="flex gap-2 ">
        <%= for %Translation{language: language} <- @contact do %>
          <div
            class={"cursor-pointer p-2 #{if @selected_language == language, do: "bg-gray-100 rounded-t"} border-(--primary-color)"}
            phx-click="select"
            phx-value-language={language}
          >
            {FieldPublicationWeb.Gettext.get_locale_labels() |> Map.get(language)}
          </div>
        <% end %>
      </div>
      <div class="markdown bg-gray-100 p-4">
        {@selected_text}
      </div>
    <% else %>
      <div class="p-8">
        <span class="text-red-700">
          <.icon name="hero-exclamation-triangle" /> No contact or imprint defined.
        </span>

        <.link
          :if={FieldPublication.Users.is_admin?(@current_user)}
          class="pl-4 text-sm"
          navigate={~p"/management/settings"}
        >
          Open settings
        </.link>
      </div>
    <% end %>
    """
  end

  def mount(_params, _session, socket) do
    %ApplicationSettings{contact: contact} = Settings.get()

    case contact do
      val when is_list(val) and val != [] ->
        selected_ui_language = Gettext.get_locale(FieldPublicationWeb.Gettext)

        %Translation{language: language} =
          Enum.find(
            contact,
            List.first(contact),
            fn %Translation{language: language} -> language == selected_ui_language end
          )

        {
          :ok,
          socket
          |> assign(:page_title, "Contact and imprint")
          |> assign(:contact, contact)
          |> set_selected(language)
        }

      _ ->
        {:ok, socket |> assign(:page_title, "Contact and imprint") |> assign(:contact, nil)}
    end
  end

  def handle_event(
        "select",
        %{"language" => language},
        socket
      ) do
    {
      :noreply,
      set_selected(socket, language)
    }
  end

  defp set_selected(%{assigns: %{contact: contact}} = socket, selected_language) do
    selected_text =
      Enum.find(
        contact,
        List.first(contact),
        fn %Translation{language: language} -> language == selected_language end
      )
      |> then(fn %Translation{text: text} -> text end)
      |> Earmark.as_html!()
      |> Phoenix.HTML.raw()

    socket
    |> assign(:selected_language, selected_language)
    |> assign(:selected_text, selected_text)
  end
end
