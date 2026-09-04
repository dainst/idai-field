defmodule FieldPublicationWeb.ContactAndImprintLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Settings

  alias FieldPublication.DatabaseSchema.{
    ApplicationSettings,
    Translation
  }

  def render(assigns) do
    ~H"""
    <.imprint {assigns} />
    <.contact {assigns} />
    """
  end

  defp imprint(assigns) do
    ~H"""
    <%= if @imprint != [] do %>
      <div :if={Enum.count(@imprint) > 1} class="flex gap-2">
        <%= for %Translation{language: language} <- @imprint do %>
          <div
            class={"cursor-pointer p-2 #{if @selected_language == language, do: "bg-gray-100 rounded-t"} border-(--primary-color)"}
            phx-click="select"
            phx-value-language={language}
          >
            {get_locale_labels() |> Map.get(language)}
          </div>
        <% end %>
      </div>
      <div class="markdown bg-gray-100 p-4">
        {@selected_text}
      </div>
    <% else %>
      <.missing_setting_info {assigns}>
        No imprint defined.
      </.missing_setting_info>
    <% end %>
    """
  end

  defp contact(assigns) do
    ~H"""
    <%= if @contact_email do %>
      <div class="p-4 w-full text-center">
        <a href={"mailto:#{@contact_email}"}><.icon name="hero-envelope" /> {@contact_email}</a>
      </div>
    <% else %>
      <.missing_setting_info {assigns}>
        No contact email defined.
      </.missing_setting_info>
    <% end %>
    """
  end

  defp missing_setting_info(assigns) do
    ~H"""
    <div class="p-8">
      <div class="text-red-700">
        <.icon name="hero-exclamation-triangle" />{render_slot(@inner_block)}
      </div>

      <.link
        :if={FieldPublication.Users.is_admin?(@current_user)}
        class="pl-4 text-sm"
        navigate={~p"/management/settings"}
      >
        Open settings
      </.link>
    </div>
    """
  end

  def mount(_params, _session, socket) do
    %ApplicationSettings{
      imprint: imprint,
      contact_email: contact_email
    } = Settings.get()

    socket =
      socket
      |> assign(:imprint, imprint)
      |> assign(:contact_email, contact_email)
      |> assign(:page_title, "Contact and imprint")

    selected_ui_language = Gettext.get_locale(FieldPublicationWeb.Translate)

    socket =
      imprint
      |> Enum.find(
        List.first(imprint),
        fn %Translation{language: language} -> language == selected_ui_language end
      )
      |> case do
        %Translation{language: language} ->
          set_selected(socket, language)

        _ ->
          socket
      end

    {:ok, socket}
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

  defp set_selected(%{assigns: %{imprint: imprint}} = socket, selected_language) do
    selected_text =
      Enum.find(
        imprint,
        List.first(imprint),
        fn %Translation{language: language} -> language == selected_language end
      )
      |> then(fn %Translation{text: text} -> text end)
      |> MDEx.to_html!()
      |> Phoenix.HTML.raw()

    socket
    |> assign(:selected_language, selected_language)
    |> assign(:selected_text, selected_text)
  end
end
