defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  require Logger
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Presentation.Components.Typography

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    RelationGroup,
    Category,
    Document
  }

  def render(assigns) do
    ~H"""
    <div>
      <.group_heading>Geometry <span class="text-xs">({@geometry_type})</span></.group_heading>
      <div
        class="relative"
        id={@id}
        centerLon={@centerLon}
        centerLat={@centerLat}
        zoom={@zoom}
        phx-hook="DocumentViewMap"
      >
        <!-- set phx-update="ignore" to ensure changes the map's DOM elements are not re-rendered on updates
          by live view, but instead the content is controlled by OpenLayers (and/or our hook logic) client side after initializiation. -->
        <div style={@style} id={"#{@id}-map"} phx-update="ignore">
          <!-- Set pointer-events-none, otherwise the tooltip will block click events on the map -->
          <div class="pointer-events-none text-xs" id={"#{@id}-identifier-tooltip"}>
            <div class="border-[1px] rounded-sm border-black flex">
              <div class="saturate-50 pl-2  text-black" id={"#{@id}-identifier-tooltip-category-bar"}>
                <div
                  class="h-full bg-white/60 p-1 font-thin"
                  id={"#{@id}-identifier-tooltip-category-content"}
                >
                </div>
              </div>
              <div class="grow p-1 h-full bg-white">
                <div class="pointer-events-none" id={"#{@id}-identifier-tooltip-content"}>
                  <!-- This div will get repurposed once the map is loaded. -->
                  Loading map...
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          :if={@document_tile_layers_state ++ @project_tile_layers_state != []}
          class="absolute p-1 top-1 right-1"
        >
          <div
            class="right-1 absolute rounded w-8 h-8 text-center pt-[2px] bg-white"
            phx-click={Phoenix.LiveView.JS.toggle(to: "##{@id}-layer-select")}
          >
            <.icon name="hero-square-3-stack-3d" />
          </div>
          <div id={"#{@id}-layer-select"} class="bg-white p-2 pr-8 max-h-64 overflow-auto" hidden>
            <.render_tile_layer_selection_group
              target={@myself}
              lang={@lang}
              publication={@publication}
              group={:document}
              layer_states={@document_tile_layers_state}
            />
            <.render_tile_layer_selection_group
              target={@myself}
              lang={@lang}
              publication={@publication}
              group={:project}
              layer_states={@project_tile_layers_state}
            />
          </div>
        </div>
        <div
          :if={@no_data}
          class="absolute w-full h-full top-0 bg-white text-center place-content-center"
        >
          <.icon class="mb-1" name="hero-no-symbol" /> No geometry context available
        </div>
      </div>
    </div>
    """
  end

  def update(
        %{id: id, publication: %Publication{} = publication, doc: doc, lang: lang} =
          assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

    socket = handle_publication_change(socket, publication, id)
    socket = process_document_tile_layers(socket, publication, doc, id)

    children_features =
      doc
      |> Data.get_relation("contains")
      |> case do
        nil ->
          []

        %RelationGroup{} = relation ->
          relation.docs
      end
      |> Enum.map(&create_feature_info(&1, lang))
      |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)

    parent_features =
      doc
      |> Data.get_relation("liesWithin")
      |> case do
        nil ->
          []

        %RelationGroup{} = relation ->
          Enum.map(relation.docs, &create_feature_info(&1, lang))
      end
      |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)
      |> case do
        [] ->
          doc
          |> Data.get_relation("isRecordedIn")
          |> case do
            nil ->
              []

            %RelationGroup{} = relation ->
              Enum.map(relation.docs, &create_feature_info(&1, lang))
          end
          |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)

        geometries_present ->
          geometries_present
      end

    document_feature = create_feature_info(doc, lang)

    assigns =
      Map.put(
        assigns,
        :geometry_type,
        get_in(document_feature, [:properties, :type]) || "None"
      )

    socket = assign(socket, assigns)

    socket =
      if parent_features == [] and children_features == [] and
           not Map.has_key?(document_feature, :geometry) do
        socket
      else
        socket
        |> push_event("document-map-update-#{id}", %{
          project: publication.project_name,
          document_feature: document_feature,
          children_features: %{
            type: "FeatureCollection",
            features: children_features
          },
          parent_features: %{
            type: "FeatureCollection",
            features: parent_features
          }
        })
        |> assign(:no_data, false)
      end

    {
      :ok,
      socket
    }
  end

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
    |> Map.put(:no_data, true)
    |> Map.put(:show_layer_select, false)
  end

  defp create_feature_info(
         %Document{
           category: %Category{color: color, labels: category_labels},
           id: uuid,
           identifier: identifier
         } = doc,
         lang
       ) do
    description =
      doc
      |> Data.get_field_value("shortDescription")
      |> case do
        nil ->
          ""

        value when is_binary(value) ->
          value

        value when is_map(value) ->
          Map.get(value, lang, Map.get(value, List.first(Map.keys(value))))
      end

    category =
      Map.get(
        category_labels,
        Gettext.get_locale(FieldPublicationWeb.Gettext),
        Map.get(category_labels, List.first(Map.keys(category_labels)))
      )

    base = %{
      type: "Feature",
      properties: %{
        uuid: uuid,
        identifier: identifier,
        color: color,
        description: description,
        category: category
      }
    }

    if geometry = Data.get_field_value(doc, "geometry") do
      base
      |> put_in([:geometry], geometry)
      |> put_in([:properties, :type], geometry["type"])
    else
      base
    end
  end

  defp extract_tile_layer_info(%{
         "resource" => %{
           "georeference" => georeference,
           "height" => height,
           "width" => width,
           "id" => uuid,
           "identifier" => identifier
         }
       }) do
    %{
      extent: georeference,
      height: height,
      width: width,
      uuid: uuid,
      identifier: identifier
    }
  end

  defp handle_publication_change(socket, %Publication{} = current, hook_id) do
    unless Map.has_key?(socket.assigns, :publication) and
             Map.equal?(socket.assigns.publication, current) do
      # If the publication already assigned to the socket differes from the one in the current
      # update call, we re-initialize the background layers. This may occur if the user switches
      # to an older or newer publication of the same project.
      Logger.debug("Resetting project level background layers.")

      project_doc_relations =
        Data.get_raw_document("project", current)
        |> Map.get("resource", %{})
        |> Map.get("relations", %{})

      default_map_layers =
        Map.get(project_doc_relations, "hasDefaultMapLayer", [])
        |> Data.get_raw_documents(current)
        |> Stream.map(&extract_tile_layer_info/1)
        |> Enum.map(fn layer_info ->
          Map.merge(layer_info, %{visible: true})
        end)

      other_map_layers =
        Map.get(project_doc_relations, "hasMapLayer", [])
        |> Data.get_raw_documents(current)
        |> Stream.map(&extract_tile_layer_info/1)
        |> Stream.map(fn layer_info ->
          Map.merge(layer_info, %{visible: false})
        end)
        |> Enum.reject(fn entry ->
          entry.uuid in Map.get(project_doc_relations, "hasDefaultMapLayer", [])
        end)

      socket
      |> push_event("document-map-set-project-layers-#{hook_id}", %{
        project: current.project_name,
        project_tile_layers: default_map_layers ++ other_map_layers
      })
      |> assign(
        :project_tile_layers_state,
        default_map_layers ++ other_map_layers
      )
    else
      # Same publication, leave project layers as they are.
      socket
    end
  end

  defp process_document_tile_layers(socket, publication, %Document{} = doc, hook_id) do
    Logger.debug("Setting document level background layers.")

    default_map_layers =
      doc.default_map_layers
      |> Data.get_raw_documents(publication)
      |> Stream.map(&extract_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: true})
      end)

    other_map_layers =
      doc.map_layers
      |> Data.get_raw_documents(publication)
      |> Stream.map(&extract_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: false})
      end)
      |> Enum.reject(fn entry -> entry.uuid in doc.default_map_layers end)

    socket
    |> push_event("document-map-set-document-layers-#{hook_id}", %{
      project: publication.project_name,
      document_tile_layers: default_map_layers ++ other_map_layers
    })
    |> assign(
      :document_tile_layers_state,
      default_map_layers ++ other_map_layers
    )
  end

  def handle_event(
        "toggle-layer",
        %{"group" => group, "uuid" => uuid},
        %{assigns: %{id: id}} = socket
      ) do
    toggled_group =
      if group == "project", do: :project_tile_layers_state, else: :document_tile_layers_state

    layer_states =
      socket.assigns[toggled_group]
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, !state.visible)
        else
          state
        end
      end)

    {
      :noreply,
      socket
      |> assign(toggled_group, layer_states)
      |> push_event("document-map-set-layer-visibility-#{id}", %{
        uuid: uuid,
        visibility:
          Enum.find(layer_states, fn state -> state.uuid == uuid end) |> Map.get(:visible)
      })
    }
  end

  defp render_tile_layer_selection_group(assigns) do
    ~H"""
    <%= if @layer_states != [] do %>
      <div class="font-semibold pb-2">
        {if @group == :project, do: gettext("Project layers"), else: gettext("Document layers")}
      </div>
      <%= for layer  <- @layer_states do %>
        <div class="text-xs">
          <span
            class="cursor-pointer"
            phx-target={@target}
            phx-click="toggle-layer"
            phx-value-group={@group}
            phx-value-uuid={layer.uuid}
          >
            <.icon class="mb-1" name={if layer.visible, do: "hero-eye", else: "hero-eye-slash"} />
          </span>
          <.link patch={
            ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@lang}/#{layer.uuid}"
          }>
            {layer.identifier}
          </.link>
        </div>
      <% end %>
    <% end %>
    """
  end
end
