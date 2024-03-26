defmodule FieldPublicationWeb.PublicationLive.TranslationsFormComponent do
  alias FieldPublication.Schemas.Translation
  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div>
      <.form for={@empty_form} phx-submit="add_translation" phx-target={@myself}>
        <table class="w-full">
          <thead>
            <tr>
              <th>Language</th>
              <th>Text</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <%= for translation <- @translations do %>
              <tr class="border-b-2">
                <td><%= translation.language %></td>
                <td class="markdown"><%= raw(Earmark.as_html!(translation.text)) %></td>
                <td
                  phx-click="edit_translation"
                  phx-value-lang={translation.language}
                  phx-value-text={translation.text}
                  phx-target={@myself}
                  class="text-center font-semibold font-mono"
                >
                  Edit
                </td>

                <td
                  phx-click="delete_translation"
                  phx-value-lang={translation.language}
                  phx-value-text={translation.text}
                  phx-target={@myself}
                  class="text-center font-semibold font-mono"
                >
                  Delete
                </td>
              </tr>
            <% end %>
            <%= if @languages != [] do %>
              <tr>
                <td>
                  <.input field={@empty_form[:language]} type="select" options={@languages} />
                </td>
                <td>
                  <.input field={@empty_form[:text]} type="textarea" />
                </td>
                <td></td>
                <td class="text-center font-semibold font-mono">
                  <button>Add</button>
                </td>
              </tr>
            <% end %>
          </tbody>
        </table>
      </.form>
    </div>
    """
  end

  def update(%{id: id, languages: language_options, translations: translations}, socket) do
    one_per_language? = Map.get(socket.assigns, :one_per_language, true)

    existing =
      Enum.map(translations, fn %Translation{language: lang} ->
        lang
      end)

    languages =
      if one_per_language? do
        Enum.reject(language_options, fn lang -> lang in existing end)
      else
        language_options
      end

    empty_form =
      %Translation{}
      |> Translation.changeset(%{})
      |> to_form()

    {
      :ok,
      socket
      |> assign(:id, id)
      |> assign(:empty_form, empty_form)
      |> assign(:languages, languages)
      |> assign(:translations, translations)
    }
  end

  def handle_event(
        "add_translation",
        %{"translation" => parameters},
        %{assigns: %{translations: existing_translations}} = socket
      ) do
    socket =
      %Translation{}
      |> Translation.changeset(parameters)
      |> Ecto.Changeset.apply_action(:create)
      |> case do
        {:error, changeset} ->
          assign(socket, :form, to_form(changeset))

        {:ok, valid_translation} ->
          # This message has to get picked up by the parent live view.
          send(
            self(),
            {:updated_translations, socket.assigns.id,
             existing_translations ++ [valid_translation]}
          )

          socket
      end

    {
      :noreply,
      socket
    }
  end

  def handle_event(
        "edit_translation",
        %{"lang" => lang, "text" => text},
        %{assigns: %{translations: translations, languages: languages}} = socket
      ) do
    IO.inspect("TODO")

    {
      :noreply,
      socket
    }
  end

  def handle_event(
        "delete_translation",
        %{"lang" => lang, "text" => text},
        %{assigns: %{translations: translations}} = socket
      ) do
    send(
      self(),
      {:updated_translations, socket.assigns.id,
       Enum.reject(translations, fn translation ->
         translation.language == lang and translation.text == text
       end)}
    )

    {
      :noreply,
      socket
    }
  end
end
