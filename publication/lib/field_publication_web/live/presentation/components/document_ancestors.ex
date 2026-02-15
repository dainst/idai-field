defmodule FieldPublicationWeb.Presentation.Components.DocumentAncestors do
  alias FieldPublicationWeb.Presentation.Components.GenericField
  alias FieldPublicationWeb.Presentation.Components.I18n
  alias FieldPublication.Publications.Data.Field
  alias FieldPublication.Publications.Data.FieldGroup
  alias FieldPublicationWeb.Presentation.Components.DocumentLink
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div>
      <.render_step nodes={@nodes} map_id={@map_id} focus={@focus} />
    </div>
    """
  end

  defp render_step(assigns) do
    ~H"""
    <%= case @nodes do %>
      <% [main_document] -> %>
        <div class="p-2 border-2 border-primary bg-panel">
          <.render_link doc={main_document} hover_target={@map_id} focus={@focus} />
          <div class="max-h-96 overflow-auto overscroll-contain">
            <%= for %FieldGroup{} = group <- main_document.groups do %>
              <% fields =
                Enum.reject(group.fields, fn %Field{name: name} ->
                  name in ["identifier", "category", "geometry"]
                end) %>
              <%= unless fields == [] do %>
                <section>
                  <.group_heading>
                    <I18n.text values={group.labels} />
                  </.group_heading>

                  <dl class="mt-2">
                    <%= for %Field{} = field <- fields do %>
                      <div>
                        <dt class="font-bold"><I18n.text values={field.labels} /></dt>
                        <dd class="pl-4">
                          <GenericField.render field={field} />
                        </dd>
                      </div>
                    <% end %>
                  </dl>
                </section>
              <% end %>
            <% end %>
          </div>
        </div>
        <% contains = Data.get_relation(main_document, "contains") %>
        <%= if contains do %>
          <div class="flex flex-row">
            <.icon name="hero-arrow-turn-down-right" class="min-w-8" />
            <div>
              <%= for main_doc_child <- contains.docs do %>
                <.render_link doc={main_doc_child} hover_target={@map_id} focus={@focus} />
              <% end %>
            </div>
          </div>
        <% end %>
      <% [current | rest] -> %>
        <.render_link doc={current} hover_target={@map_id} focus={@focus} />

        <div class="flex flex-row">
          <.icon name="hero-arrow-turn-down-right min-w-8" />
          <div>
            <.render_step nodes={rest} map_id={@map_id} focus={@focus} />
          </div>
        </div>
      <% [] -> %>
        None
    <% end %>
    """
  end

  attr :doc, Document, required: true
  attr :hover_target, :string, required: true
  attr :focus, :atom, required: true

  def render_link(assigns) do
    ~H"""
    <% geometry = Data.get_field(@doc, "geometry") %>

    <%= if geometry do %>
      <div
        id={"ancester_link_#{@doc.id}"}
        phx-hook="HoverHighlightMapFeature"
        target_dom_element={@hover_target}
        target_id={@doc.id}
      >
        <DocumentLink.show
          id={"#{@doc.id}_ancestor_view_link"}
          doc={@doc}
          image_count={10}
          geometry_indicator={true}
          focus={@focus}
        />
      </div>
    <% else %>
      <div>
        <DocumentLink.show
          id={"#{@doc.id}_ancestor_view_link"}
          doc={@doc}
          image_count={10}
          geometry_indicator={true}
          focus={@focus}
        />
      </div>
    <% end %>
    """
  end

  def update(
        %{
          doc: %Document{} = doc,
          map_id: map_id,
          ancestors: ancestors
        } = params,
        socket
      ) do
    {
      :ok,
      socket
      |> assign(:nodes, ancestors ++ [doc])
      |> assign(:map_id, map_id)
      |> assign(:focus, Map.get(params, :focus, :default))
    }
  end
end
