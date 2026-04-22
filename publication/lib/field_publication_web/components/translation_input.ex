defmodule FieldPublicationWeb.Components.TranslationInput do
  @moduledoc """
  Input component for adding embedded `Translation{}` items
  to a parent document.

  The component expects the parent document to implement sort and
  drop parameters for the embedded translation field. See for example
  `FieldPublication.DatabaseSchema.Publication`.

  This is a generalized implementation of Phoenix LiveViews's
  `inputs_for/1` guide, see https://hexdocs.pm/phoenix_live_view/Phoenix.Component.html#inputs_for/1
  """

  use FieldPublicationWeb, :html

  attr :field, Phoenix.HTML.FormField, required: true
  attr :language_options, :list, required: true
  attr :exclusive?, :boolean, default: true

  slot :heading, required: true
  slot :no_translations, required: true

  def translation_input(assigns) do
    ~H"""
    <% sort = "#{String.replace_trailing(@field.name, "]", "")}_sort][]" %>
    <% drop = "#{String.replace_trailing(@field.name, "]", "")}_drop][]" %>
    <.group_heading>
      {render_slot(@heading)}
      <button
        type="button"
        name={sort}
        value="new"
        class="cursor-pointer"
        phx-click={JS.dispatch("change")}
      >
        <.icon name="hero-document-plus" class="w-6 h-6 relative" />
      </button>
    </.group_heading>

    <.error :for={{msg, _opts} <- @field.errors}>{msg}</.error>

    <div :if={@field.value == []} class="p-2 italic">
      <.icon name="hero-exclamation-triangle" /> {render_slot(@no_translations)}
    </div>
    <.inputs_for :let={nested} field={@field}>
      <div class="flex gap-2 mt-2">
        <div class="basis-1/2">
          <input
            type="hidden"
            name={sort}
            value={nested.index}
          />
          <div class="flex gap-1">
            <button
              type="button"
              name={drop}
              class="cursor-pointer"
              value={nested.index}
              phx-click={JS.dispatch("change")}
            >
              <.icon name="hero-document-minus" class="w-6 h-6 relative" />
            </button>
            <.input
              type="select"
              field={nested[:language]}
              options={@language_options}
            />
          </div>

          <.input type="textarea" field={nested[:text]} placeholder="Add some markdown here" />
        </div>

        <div class="ml-2 p-2 bg-gray-100 border border-black basis-1/2">
          <div class="text-lg mb-8 font-thin">Preview</div>
          <div class="markdown">
            <% text = Phoenix.HTML.Form.input_value(nested, :text) || "" %>
            {Earmark.as_html!(text)
            |> Phoenix.HTML.raw()}
          </div>
        </div>
      </div>
    </.inputs_for>

    <input type="hidden" name={drop} />
    """
  end
end
