defmodule FieldHubWeb.Components.IssuesPanel do
  use FieldHubWeb, :live_component

  alias Phoenix.LiveView.JS

  def render(assigns) do
    ~H"""
    <section>
      <h2>
        <div class="row">
          <div class="column column-80">
            Issues{if @overall_issue_count != 0, do: " (#{@overall_issue_count})"}
          </div>
          <button class="button column" phx-click="evaluate_issues">
            <%= case @issues do %>
              <% nil -> %>
                Evaluate
              <% _data -> %>
                Re-evaluate
            <% end %>
          </button>
        </div>
      </h2>
      <%= if @evaluating? do %>
        <div class="row">
          <span class="issue-loading-spinner"></span>
          <span style="margin-top:6px;margin-left:10px">
            Evaluating issues, for big projects this may take several minutes...
          </span>
        </div>
      <% end %>

      <%= case @issues do %>
        <% nil -> %>
          No data.
        <% issues when issues == %{} -> %>
          None.
        <% grouped_issues when is_map(grouped_issues) -> %>
          <%= for {{type, severity}, issues} <- grouped_issues do %>
            <section id={"#{type}-issue-group"} class="issue-group hide">
              <h3 class={issue_classes(severity)}>
                <div
                  class="show-toggle"
                  phx-click={JS.remove_class("hide", to: "##{type}-issue-group")}
                >
                  <img src="/images/hero-icons/folder.svg" />{get_issue_type_label(type)} ({Enum.count(
                    issues
                  )})
                </div>
                <div class="hide-toggle" phx-click={JS.add_class("hide", to: "##{type}-issue-group")}>
                  <img src="/images/hero-icons/folder-open.svg" />{get_issue_type_label(type)} ({Enum.count(
                    issues
                  )})
                </div>
              </h3>

              <.render_issue_group project={@project} type={type} issues={issues} />
            </section>
          <% end %>
      <% end %>
    </section>
    """
  end

  def update(%{issues: issues, project: project, evaluating?: evaluating?}, socket) do
    overall_issue_count =
      if is_list(issues) do
        Enum.count(issues)
      else
        0
      end

    issues =
      case issues do
        nil ->
          nil

        issues ->
          Enum.group_by(issues, fn %{type: type, severity: severity} -> {type, severity} end)
      end

    {
      :ok,
      socket
      |> assign(:project, project)
      |> assign(:evaluating?, evaluating?)
      |> assign(:issues, issues)
      |> assign(:overall_issue_count, overall_issue_count)
    }
  end

  defp render_issue_group(%{type: :no_project_document} = assigns) do
    ~H"""
    <span class="issue-content">Could not find a project document in the database!</span>
    """
  end

  defp render_issue_group(%{type: :no_default_project_map_layer} = assigns) do
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

  defp render_issue_group(%{type: :missing_original_image} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>Some original files are missing and should be uploaded by their creator.</em>
      <ul>
        <%= for %{data: data} <- @issues do %>
          <li class="container">
            '{data.file_name}' ({data.file_type}),
            created by {data.created_by} on {data.created}.
          </li>
        <% end %>
      </ul>
    </div>
    """
  end

  defp render_issue_group(%{type: :image_variants_size} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>In general the original images are expected to be larger than their thumbnails.
        For the following files this is not the case.</em>

      <%= for %{data: data} <- @issues do %>
        <div class="row">
          <div class="column column-25">
            <img src={"#{get_thumbnail_data(data.uuid, @project)}"} />
          </div>
          <div class="column">
            '{data.file_name}' ({data.file_type}), created by {data.created_by} on {data.created}, sizes:
            <strong>
              {Sizeable.filesize(data.thumbnail_size)} (thumbnail), {Sizeable.filesize(
                data.original_size
              )} (original)
            </strong>
          </div>
        </div>
      <% end %>
    </div>
    """
  end

  defp render_issue_group(%{type: :missing_image_copyright} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>
        There are some images without copyright information and/or information who drafted them.
      </em>
      <ul>
        <%= for %{data: data} <- @issues do %>
          <li class="container">
            '{data.file_name}' ({data.file_type}),
            database entry created by {data.created_by} on {data.created}.
          </li>
        <% end %>
      </ul>
    </div>
    """
  end

  defp render_issue_group(%{type: :unresolved_relation} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>
        There are documents missing, that are being referenced by other documents in the database.
      </em>
      <%= for %{data: data} <- @issues do %>
        <div style="padding:5px;border-width:1px;border-style:solid;margin-bottom:5px">
          Missing document <span style="text-decoration:underline;">{data.missing}</span>
          is referenced by the following documents:
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
                  <td>{doc.identifier}</td>
                  <td>{doc.category}</td>
                  <td>
                    <ul>
                      <%= for relation <- doc.relations do %>
                        <li>{relation}</li>
                      <% end %>
                    </ul>
                  </td>
                  <td>
                    <div>Created by {doc.created.user}, {doc.created.date}.</div>
                    <%= for modification <- doc.modified do %>
                      <div>Changed by {modification.user}, {modification.date}.</div>
                    <% end %>
                  </td>
                </tr>
              <% end %>
            </tbody>
          </table>
        </div>
      <% end %>
    </div>
    """
  end

  defp render_issue_group(%{type: :non_unique_identifiers} = assigns) do
    ~H"""
    <div class="issue-content">
      <em>There are documents sharing the same identifier.</em>
      <br /> This may happen if two researchers add the same identifier while working
      offline, then activate syncing at a later point. Solution: Update the identifier in your desktop application.
      <%= for %{data: data} <- @issues do %>
        <div style="padding:5px;border-width:1px;border-style:solid;margin-bottom:5px">
          Identifier "{data.identifier}" is used by <a
            style="cursor: pointer;"
            phx-click={
              JS.toggle(
                to: "#duplicate-identifier-docs-#{Base.encode32(data.identifier, padding: false)}"
              )
            }
          > <%= Enum.count(data.documents) %> documents</a>.
          <div
            hidden
            id={"duplicate-identifier-docs-#{Base.encode32(data.identifier, padding: false)}"}
          >
            <%= for doc <- data.documents do %>
              <pre><%= Jason.encode!(doc, pretty: true) %></pre>
            <% end %>
          </div>
        </div>
      <% end %>
    </div>
    """
  end

  defp render_issue_group(assigns) do
    # Fallback function, displays issues data as list with key/value as columns.
    ~H"""
    <div class="issue-content">
      <%= for {%{data: data}, issue_index} <- Enum.with_index(@issues) do %>
        <table class="content">
          <%= if Enum.count(data) != 0 do %>
            <thead>
              <tr>
                <th colspan="2">Issue #{issue_index}</th>
              </tr>
            </thead>
            <tbody>
              <%= for {key, value} <- data do %>
                <tr>
                  <td>
                    {key}
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
        |> then(fn encoded ->
          "data:image/*;base64,#{encoded}"
        end)

      {:error, :enoent} ->
        "No thumbnail available"
    end
  end

  defp get_issue_type_label(:no_project_document), do: "No project document"
  defp get_issue_type_label(:no_default_project_map_layer), do: "No default map layer"
  defp get_issue_type_label(:file_directory_not_found), do: "Project file directory not found"
  defp get_issue_type_label(:image_variants_size), do: "Original images file size"
  defp get_issue_type_label(:missing_image_copyright), do: "Images missing copyright information"
  defp get_issue_type_label(:missing_original_image), do: "Missing original images"
  defp get_issue_type_label(:unexpected_error), do: "Unexpected issue"
  defp get_issue_type_label(:unresolved_relation), do: "Unresolved relation"

  defp get_issue_type_label(:non_unique_identifiers),
    do: "Same identifier used for different documents"

  defp get_issue_type_label(type), do: type

  defp issue_classes(:info), do: "monitoring-issue info"
  defp issue_classes(:warning), do: "monitoring-issue warning"
  defp issue_classes(:error), do: "monitoring-issue error"
end
