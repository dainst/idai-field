defmodule FieldPublicationWeb.ContactAndImprintLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Settings

  alias FieldPublication.DatabaseSchema.{
    ApplicationSettings,
    Translation
  }

  def render(assigns) do
    ~H"""
    <div class="flex gap-2 ">
      <%= for %Translation{language: language} <- @imprints do %>
          <div class={"cursor-pointer p-2 #{if @selected_language == language, do: "border"} border-(--primary-color)"} phx-click="select" phx-value-language={language}>
        {FieldPublicationWeb.Gettext.get_locale_labels() |> Map.get(language)}

        </div>
      <% end %>
    </div>

    <%= if @imprints == [] do %>
      Contact and imprint missing.
    <% else %>
      <div class="markdown">
        {@selected_text}
      </div>
    <% end %>
    """
  end

  def mount(_params, _session, socket) do
    %ApplicationSettings{imprints: imprints} = Settings.get_settings()
    selected_ui_language = Gettext.get_locale(FieldPublicationWeb.Gettext)

    %Translation{language: language} =
      Enum.find(
        imprints,
        List.first(imprints),
        fn %Translation{language: language} -> language == selected_ui_language end
      )

    {
      :ok,
      socket
      |> assign(:page_title, "Contact and imprint")
      |> assign(:imprints, imprints)
      |> set_selected(language)
    }
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

  defp set_selected(%{assigns: %{imprints: imprints}} = socket, selected_language) do
    selected_text =
      Enum.find(
        imprints,
        List.first(imprints),
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
