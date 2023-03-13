defmodule FieldHubWeb.ProjectShowLiveIssues do
  use FieldHubWeb, :live_component

  @moduledoc """
  Bundles `render/1` functions for lists for different types of issues.

  The type of issue is determined by the `id` value used in the parent
  `live_component/1` call.
  """

  alias Phoenix.LiveView.JS

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

      <%= for %{data: data} <- @issues do %>
      <div class="row">
          <div class="column column-25">
            <img src={"#{get_thumbnail_data(data.uuid, @project)}"}/>
          </div>
          <div class="column">
            '<%= data.file_name %>' (<%= data.file_type %>), created by <%= data.created_by %> on <%= data.created %>, sizes:
            <strong>
              <%= Sizeable.filesize(data.thumbnail_size) %> (thumbnail), <%= Sizeable.filesize(data.original_size) %> (original)
            </strong>
          </div>
        </div>
      <% end %>
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
      <em>
        There are documents missing, that are being referenced by other documents in the database.
      </em>
      <br/>
      Possible solutions:
        <ul>
          <li>Remove or update the broken relations in the desktop application.</li>
          <li>Check project backups to find out about more about the now missing document.</li>
        </ul>
      <%= for %{data: data} <- @issues do %>
        <div style="padding:5px;border-width:1px;border-style:solid;margin-bottom:5px">
          Missing document <span style="text-decoration:underline;"><%= data.missing %></span> is referenced by the following documents:
          <table>
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Category</th>
              <th>Unresolved relationship(s)</th>
              <th>History</th>
            </tr>
          </thead>
          <tbody>
          <%= for doc <- data.referencing_docs do %>
            <tr>
              <td><%= doc.identifier %></td>
              <td><%= doc.category %></td>
              <td>
                <ul>
                <%= for relation <- doc.relations do %>
                  <li><%= relation %></li>
                <% end %>
                </ul>
              </td>
              <td>
                <div>Created by <%= doc.created.user %>, <%= doc.created.date %>.</div>
                <%= for modification <- doc.modified do %>
                  <div>Changed by <%= modification.user %>, <%= modification.date %>.</div>
                <% end %>
              </td>
            <tr>
          <% end %>
          </tbody>
          </table>
        </div>
      <% end %>
    </div>
    """
  end

  def render(%{id: :non_unique_identifiers} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>There are documents sharing the same identifier.</em>
      <br/>
        This may happen if two researchers add the same identifier while working
        offline, then activate syncing at a later point. Solution: Update the identifier in your desktop application.
      <%= for %{data: data} <- @issues do %>

        <div style="padding:5px;border-width:1px;border-style:solid;margin-bottom:5px">
        Identifier "<%= data.identifier %>" is used by
        <a style="cursor: pointer;" phx-click={
          JS.toggle(to: "#duplicate-identifier-docs-#{Base.encode32(data.identifier, padding: false)}")
        }> <%= Enum.count(data.documents) %> documents</a>.

        <div hidden id={"duplicate-identifier-docs-#{Base.encode32(data.identifier, padding: false)}"}>
          <%= for doc <- data.documents do %>
            <pre><%= Jason.encode!(doc, pretty: true) %></pre>
          <% end %>
        </div>
      </div>
      <% end %>
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

  defp get_thumbnail_data(uuid, project) do
    # TODO: Add  /ui/images route and replace blob variant
    FieldHub.FileStore.get_file_path(uuid, project, :thumbnail_image)
    |> case do
      {:ok, path} ->
        path
        |> File.read!()
        |> Base.encode64()
        |> then(fn(encoded) ->
          "data:image/*;base64,#{encoded}"
        end)
      {:error, :enoent} ->
        "No thumbnail available"
    end
  end
end
