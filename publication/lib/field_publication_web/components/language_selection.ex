defmodule FieldPublicationWeb.Components.LanguageSelection do
  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div class={"flex #{padding()} gap-1 relative"}>
      <div class="absolute bg-white w-full z-50 hidden flex-col gap-0.5" id={"#{@id}_dropdown"}>
        <%= for language_key <- @language_keys do %>
          <button
            class={"text-left #{if language_key == @selected, do: "bg-primary/20" } cursor-pointer border text-xs p-1 text-primary hover:text-primary-hover"}
            phx-click={
              JS.push("select", value: %{new: language_key}, target: @myself)
              |> JS.hide(to: "##{@id}_dropdown")
            }
          >
            <span
              id={"#{@id}_selection_#{language_key}"}
              phx-hook="DisplayLanguage"
              lang={language_key}
            >
              {language_key}
            </span>
          </button>
        <% end %>
      </div>
      <div class="flex flex-col">
        <button
          :if={!@hide_selection?}
          class="p-1 cursor-pointer border text-xs text-primary hover:text-primary-hover"
          phx-click={JS.toggle(to: "##{@id}_dropdown", display: "flex")}
        >
          <span id={"#{@id}_selected_value"} phx-hook="DisplayLanguage" lang={@selected}>
            {@selected}
          </span>
        </button>
      </div>
      <div class="grow">
        {render_slot(@inner_block, @translations[@selected])}
      </div>
    </div>
    """
  end

  def update(
        %{
          id: id,
          inner_block: inner_block,
          translations: translations
        } = assigns,
        socket
      ) do
    language_keys = Map.keys(translations)

    initial_selection = pick_default_language_key(translations)

    {
      :ok,
      socket
      |> assign(:id, id)
      |> assign(:hide_selection?, Map.get(assigns, :hide_selection?, false))
      |> assign(:inner_block, inner_block)
      |> assign(:language_keys, language_keys)
      |> assign(:translations, translations)
      |> assign(:selected, initial_selection)
    }
  end

  def handle_event("select", %{"new" => lang}, socket) do
    {
      :noreply,
      assign(socket, :selected, lang)
    }
  end

  def padding(), do: "p-0.5"
end
