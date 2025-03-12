defmodule FieldHubWeb.PageHTML do
  use FieldHubWeb, :html

  alias FieldHub.User

  def index(assigns) do
    ~H"""
    <h1>Field Hub</h1>

    This server runs Field Hub (<small><%= Application.spec(:field_hub, :vsn) %></small>), providing a centralized syncing target for different projects that use the <a href="https://github.com/dainst/idai-field" target="_blank">Field desktop application</a>.

    <%= if @current_user do %>
        <%= if User.is_admin?(@current_user) do %>
            <hr>
            <.link navigate={~p"/ui/projects/create"}>
              Create a new project
            </.link>
        <% end %>

        <hr>

        <h2>Your projects</h2>

        <%= case @projects do %>
        <% [] -> %>
            No projects.
        <% projects -> %>

            <ul>
            <%= Enum.map(projects, fn(project) -> %>
                <li>
                  <.link navigate={~p"/ui/projects/show/#{project}"}>{project}</.link>
                </li>
            <% end) %>
            </ul>
        <% end %>
    <% end %>
    """
  end
end
