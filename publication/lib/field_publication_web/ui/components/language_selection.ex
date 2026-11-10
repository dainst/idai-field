defmodule FieldPublicationWeb.UI.Components.LanguageSelection do
  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div class="flex mt-0.5 mb-0.5">
      <button
        class="w-6 h-6 text-center font-mono rounded-full cursor-pointer text-xs bg-primary text-primary-inverse hover-primary-inverse-hover hover:bg-primary-hover"
        phx-click={JS.toggle(to: "##{@id}_dropdown", display: "flex")}
      >
        <span id={"#{@id}_selected_value"}>
          {@selected}
        </span>
      </button>
      <div
        class="flex font-mono hidden gap-0.5"
        id={"#{@id}_dropdown"}
      >
        <%= for language_key <- @language_keys do %>
          <button
            :if={language_key != @selected}
            class="w-6 h-6 text-center font-mono rounded-full cursor-pointer text-xs border border-primary text-primary hover:text-primary-hover hover:border-primary-hover"
            phx-click={
              JS.push("select", value: %{new: language_key}, target: @myself)
              |> JS.hide(to: "##{@id}_dropdown")
            }
          >
            <span id={"#{@id}_selection_#{language_key}"}>
              {language_key}
            </span>
          </button>
        <% end %>
      </div>
      <span class="ml-2">
        {render_slot(@inner_block, @translations[@selected])}
      </span>
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
