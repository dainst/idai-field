defmodule FieldPublicationWeb.TranslationLive.FormComponent do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.inputs_for :let={translation} field={@form_field}>
        <div class="flex flex-row w-full border-2 p-2 m-2 bg-slate-100 rounded">
          <div>
            <.input
              type="select"
              options={ISO639.iso639_1_codes()}
              field={translation[:language]}
              label="Language"
            />
          </div>
          <div class="pl-2 w-96">
            <.input type="textarea" field={translation[:text]} label="Comment" />
          </div>
          <div>
            <a
              class="cursor-pointer"
              phx-click={@remove}
              phx-target={
                # This form can be used by both views and live components. If live components want to
                # handle the data themselves, they can pass target={@myself}. Otherwise their view will have to
                # implement `handle_info/3`.
                if assigns[:target], do: @target
              }
              phx-value-id={translation.id}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </a>
          </div>
        </div>
      </.inputs_for>
      <button
        type="button"
        phx-click={@add}
        phx-target={
          # Same as for @remove above.
          if assigns[:target], do: @target
        }
        type="button"
      >
        Add comment
      </button>
    </div>
    """
  end
end
