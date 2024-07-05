defmodule FieldPublicationWeb.Presentation.Components.PublicationSelection do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  def render(assigns) do
    ~H"""
    <form
      id="project_options"
      class="flex flex-row gap-2 items-center"
      phx-change="project_options_changed"
    >
      <.link navigate={~p"/"}>
        <.icon name="hero-globe-europe-africa-solid" />
      </.link>
      <div>/</div>
      <div><%= @current_publication.project_name %></div>
      <div>/</div>

      <% draft_dates =
        Enum.map(@publications, fn %{draft_date: draft_date} -> Date.to_iso8601(draft_date) end) %>
      <%= if Enum.count(draft_dates) == 1 do %>
        <div>
          <%= List.first(draft_dates) %>
        </div>
      <% else %>
        <.input
          type="select"
          name="project_date_selection"
          options={draft_dates}
          value={Date.to_iso8601(@current_publication.draft_date)}
        />
      <% end %>
      <div>/</div>
      <%= if Enum.count(@current_publication.languages) == 1 do %>
        <div><%= List.first(@current_publication.languages) %></div>
      <% else %>
        <.input
          type="select"
          name="project_language_selection"
          options={@current_publication.languages}
          value={@selected_lang}
        />
      <% end %>
      <div>/</div>
      <.link patch={
        ~p"/projects/#{@current_publication.project_name}/#{@current_publication.draft_date}/#{@selected_lang}"
      }>
        <.icon name="hero-home-solid" />
      </.link>
      <%= if @identifier do %>
        <div>/</div>
        <div>
          <%= @identifier %>
        </div>
      <% end %>
    </form>
    """
  end
end
