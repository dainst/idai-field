defmodule FieldHubWeb.ProjectShowLiveIssues do
  use FieldHubWeb, :live_component

  @moduledoc """
  Bundles `render/1` functions for lists for different types of issues.

  The type of issue is determined by the `id` value used in the parent
  `live_component/1` call.
  """

  def render(%{id: :no_project_document} = assigns) do
    ~H"""
    <span class="issue-content">Could not find a project document in the database!</span>
    """
  end

  def render(%{id: :no_default_project_map_layer} = assigns) do
    ~H"""
    <span class="issue-content">
      <em>There is no default map layer defined for the project.</em>

      <div>
        The default layer will be active for new project members when they download the
        Field project for the first time. It can also be displayed as the default map layer
        in later publishing steps.
      </div>
    </span>
    """
  end

  def render(%{id: :missing_original_image} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>Some original files are missing and should be uploaded by their creator.</em>
      <ul>
        <%= for %{data: data} <- @issues do %>
          <li class="container">
            '<%= data.file_name %>' (<%= data.file_type %>),
            created by <%= data.created_by %> on <%= data.created %>.
          </li>
        <% end %>
      </ul>
    </div>
    """
  end

  def render(%{id: :image_variants_size} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>In general the original images are expected to be larger than their thumbnails.
      For the following files this is not the case.</em>
      <ul>
        <%= for %{data: data} <- @issues do %>
          <li class="container">
            '<%= data.file_name %>' (<%= data.file_type %>),
            created by <%= data.created_by %> on <%= data.created %>, sizes:
            <strong>
              <%= Sizeable.filesize(data.thumbnail_size) %> (thumbnail), <%= Sizeable.filesize(data.original_size) %> (original)
            </strong>
          </li>
        <% end %>
      </ul>
    </div>
    """
  end

  def render(%{id: :missing_image_copyright} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>There are some images without copyright information and/or information who drafted them.</em>
      <ul>
        <%= for %{data: data} <- @issues do %>
          <li class="container">
            '<%= data.file_name %>' (<%= data.file_type %>),
            database entry created by <%= data.created_by %> on <%= data.created %>.
          </li>
        <% end %>
      </ul>
    </div>
    """
  end

  def render(%{id: :unresolved_relation} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>The following database documents contained unresolved relations.</em>

      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Unresolved relations (UUIDs)</th>
          </tr>
        </thead>
        <tbody>
        <%= for %{data: data} <- @issues do %>
            <tr>
              <td><pre style="white-space: pre-wrap"><%= inspect(data.doc, pretty: true) %></pre></td>
              <td>
              <%= for uuid <- data.unresolved do %>
                  <div style="border-width:1px;border-style:dashed;padding:2px"><%= uuid %></div>
              <% end %>
              </td>
            </tr>
        <% end %>
        </tbody>
      </table>
    </div>
    """
  end

  def render(assigns) do
    # Fallback function, renders issues data as list with key/value as columns.
    ~H"""
    <div class="issue-content">
      <%= for {%{data: data}, issue_index} <- Enum.with_index(@issues) do %>
        <table class="content">
        <%= if Enum.count(data) != 0 do %>
          <thead>
            <tr>
                <th colspan="2">Issue #<%= issue_index %></th>
            </tr>
          </thead>
          <tbody>
            <%= for {key, value} <- data do %>
              <tr>
                <td >
                  <%= key %>
                </td>
                <td>
                  <pre><%= inspect(value, pretty: true) %></pre>
                </td>
              </tr>
            <% end %>
          </tbody>
        <% else %>
          <tr>
            "No description available"
          </tr>
        <% end %>
        </table>
      <% end %>
    </div>
    """
  end
end
