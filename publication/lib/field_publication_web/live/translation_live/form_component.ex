defmodule FieldPublicationWeb.TranslationLive.FormComponent do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <div class="flex flex-row">
        <.inputs_for :let={translation} field={@form_field}>
          <.input type="select" options={ISO639.iso639_1_codes()} field={translation[:language]}/>
          <.input type="textarea" field={translation[:text]}/>
          <span phx-click={@remove} phx-value-id={translation.id}>X</span>
        </.inputs_for>
      </div>
      <a phx-click={@add} type="button">Add comment</a>
    </div>
    """
  end
end
