defmodule FieldPublicationWeb.Presentation.Components.PublicationSelection do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  def render(assigns) do
    ~H"""
    <form id="project_options" phx-change="project_options_changed">
      <div class="flex flex-row">
        <div class="mt-4">
          <.link navigate={~p"/"}>
            <.icon class="ml-1 mb-1" name="hero-globe-europe-africa-solid" />
          </.link>
          /
        </div>

        <div class=" ml-2 mt-4">
          <%= @project_name %> /
        </div>
        <div class="ml-2">
          <%= if Enum.count(@publication_dates) == 1 do %>
            <div class="mt-4">
              <%= List.first(@publication_dates) %>
            </div>
          <% else %>
            <.input
              type="select"
              name="project_date_selection"
              options={@publication_dates}
              value={@selected_date}
            />
          <% end %>
        </div>
        <div class="mt-4 ml-2">/</div>
        <div class="ml-2">
          <%= if Enum.count(@languages) == 1 do %>
            <div class="mt-4"><%= List.first(@languages) %></div>
          <% else %>
            <.input
              type="select"
              name="project_language_selection"
              options={@languages}
              value={@selected_lang}
            />
          <% end %>
        </div>
        <div class="mt-4 ml-2">
          /
          <.link patch={~p"/projects/#{@project_name}/#{@selected_date}/#{@selected_lang}"}>
            <.icon class="mb-1" name="hero-home-solid" />
          </.link>
        </div>
        <%= if @identifier do %>
          <div class="mt-4 ml-2">/</div>
          <div class="mt-4 ml-2">
            <%= @identifier %>
          </div>
        <% end %>
      </div>
    </form>
    """
  end
end
