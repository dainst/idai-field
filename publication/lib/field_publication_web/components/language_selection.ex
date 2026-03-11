defmodule FieldPublicationWeb.Components.LanguageSelection do
  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div class="flex p-0.5 gap-1 relative">
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
          class="p-1 cursor-pointer border text-xs text-primary hover:text-primary-hover"
          phx-click={JS.toggle(to: "##{@id}_dropdown", display: "flex")}
        >
          <span id={"#{@id}_selected_value"} phx-hook="DisplayLanguage" lang={@selected}>
            {@selected}
          </span>
        </button>
      </div>
      <div>
        {render_slot(@inner_block, @translations[@selected])}
      </div>
    </div>
    """
  end

  # def render(%{variant: :single_value} = assigns) do
  #   ~H"""
  #   <div>
  #     {render_slot(@inner_block, @text)}
  #   </div>
  #   """
  # end

  # def render(%{variant: :picker} = assigns) do
  #   ~H"""
  #   <div class="flex p-0.5 gap-1 relative">
  #     <div class="absolute bg-white w-full z-50 hidden flex-col gap-0.5" id={"#{@id}_dropdown"}>
  #       <%= for language_key <- @language_keys do %>
  #         <button
  #           class={"text-left #{if language_key == @selected, do: "bg-primary/20" } cursor-pointer border text-xs p-1 text-primary hover:text-primary-hover"}
  #           phx-click={
  #             JS.push("select", value: %{new: language_key}, target: @myself)
  #             |> JS.hide(to: "##{@id}_dropdown")
  #           }
  #         >
  #           <span
  #             id={"#{@id}_selection_#{language_key}"}
  #             phx-hook="DisplayLanguage"
  #             lang={language_key}
  #           >
  #             {language_key}
  #           </span>
  #         </button>
  #       <% end %>
  #     </div>
  #     <div class="flex flex-col">
  #       <button
  #         class="p-1 cursor-pointer border text-xs text-primary hover:text-primary-hover"
  #         phx-click={JS.toggle(to: "##{@id}_dropdown", display: "flex")}
  #       >
  #         <span id={"#{@id}_selected_value"} phx-hook="DisplayLanguage" lang={@selected}>
  #           {@selected}
  #         </span>
  #       </button>
  #     </div>
  #     <div>
  #       {render_slot(@inner_block, @translations[@selected])}
  #     </div>
  #   </div>
  #   """
  # end

  # def render(%{variant: :unhandled} = assigns) do
  #   ~H"""
  #   <div>
  #     <div class="bg-yellow-400 p-4">
  #       <.icon name="hero-exclamation-triangle" />Unhandled translated field
  #     </div>
  #     {render_slot(@inner_block, inspect(@field))}
  #   </div>
  #   """
  # end

  def update(%{id: id, inner_block: inner_block, translations: translations} = _assigns, socket) do
    language_keys = Map.keys(translations)

    initial_selection = pick_default_translation(Map.keys(translations))

    {
      :ok,
      socket
      |> assign(:id, id)
      |> assign(:inner_block, inner_block)
      |> assign(:language_keys, language_keys)
      |> assign(:translations, translations)
      |> assign(:selected, initial_selection)
    }
  end

  # def update(assigns, socket) do
  #   {
  #     :ok,
  #     socket
  #     |> assign(:id, assigns.id)
  #     |> assign(:inner_block, assigns.inner_block)
  #     |> pick_variant(assigns)
  #   }
  # end

  # defp pick_variant(socket, %{field: %Field{value_labels: value_labels, value: value}} = _assigns)
  #      when is_binary(value) and (value_labels == %{} or is_nil(value_labels)) do
  #   # The field's "value" is just a single binary value.
  #   # There are also no translated labels for the value.

  #   socket
  #   |> assign(:variant, :single_value)
  #   |> assign(:text, value)
  # end

  # defp pick_variant(
  #        socket,
  #        %{specific_value: value, field: %Field{value_labels: value_labels}} = _assigns
  #      )
  #      when is_binary(value) and (value_labels == %{} or is_nil(value_labels)) do
  #   # The field's "value" contains a list instead of a single value, (for example if the input was
  #   # a checkbox list). We only want to render one of these values, passed to the component as
  #   # `specific_value`.
  #   #
  #   # There are also no translated labels for the value.
  #   socket
  #   |> assign(:variant, :single_value)
  #   |> assign(:text, value)
  # end

  # defp pick_variant(
  #        socket,
  #        %{specific_value: value, field: %Field{value_labels: value_labels} = _field} = _assigns
  #      )
  #      when is_binary(value) and is_map(value_labels) do
  #   # The field's "value" contains a list instead of a single value, (for example if the input was
  #   # a checkbox list). We only want to render one of these values, passed to the component as
  #   # `specific_value`.
  #   #
  #   # There are translated labels for the value.
  #   case Map.keys(value_labels[value]) do
  #     [] ->
  #       # The value is not a key in the field's value_labels, fallback to displaying
  #       # the value itself instead as a single value.
  #       socket
  #       |> assign(:variant, :single_value)
  #       |> assign(:text, value)

  #     [only_translation] ->
  #       # There is only one translation translation label for the current value, display
  #       # that one as a single value.
  #       socket
  #       |> assign(:variant, :single_value)
  #       |> assign(:text, value_labels[value][only_translation])

  #     language_keys ->
  #       setup_picker_data(socket, language_keys, value_labels[value])
  #   end
  # end

  # defp pick_variant(
  #        socket,
  #        %{field: %Field{value_labels: value_labels, value: value} = _field} = _assigns
  #      )
  #      when is_binary(value) and is_map(value_labels) do
  #   # The field's "value" contains a binary value.
  #   # There are translated labels for the value.
  #   case Map.keys(value_labels[value]) do
  #     [] ->
  #       # The value is not a key in the field's value_labels, fallback to displaying
  #       # the value itself instead as a single value.
  #       socket
  #       |> assign(:variant, :single_value)
  #       |> assign(:text, value)

  #     [only_translation] ->
  #       # There is only one translation translation label for the current value, display
  #       # that one as a single value.
  #       socket
  #       |> assign(:variant, :single_value)
  #       |> assign(:text, value_labels[value][only_translation])

  #     language_keys ->
  #       setup_picker_data(socket, language_keys, value_labels[value])
  #   end
  # end

  # defp pick_variant(socket, assigns) do
  #   socket
  #   |> assign(:variant, :unhandled)
  #   |> assign(assigns)
  # end

  # defp setup_picker_data(socket, language_keys, labels) do
  #   user_ui_language = Gettext.get_locale(FieldPublicationWeb.Gettext)

  #   initial_selection =
  #     cond do
  #       user_ui_language in language_keys ->
  #         user_ui_language

  #       "en" in language_keys ->
  #         "en"

  #       true ->
  #         List.first(language_keys)
  #     end

  #   socket
  #   |> assign(:variant, :picker)
  #   |> assign(:language_keys, language_keys)
  #   |> assign(:labels, labels)
  #   |> assign(:selected, initial_selection)
  # end
  #

  def pick_default_translation(options) when is_list(options) do
    user_ui_language = Gettext.get_locale(FieldPublicationWeb.Gettext)

    cond do
      user_ui_language in options ->
        user_ui_language

      "en" in options ->
        "en"

      true ->
        List.first(options)
    end
  end

  def handle_event("select", %{"new" => lang}, socket) do
    {
      :noreply,
      assign(socket, :selected, lang)
    }
  end
end
