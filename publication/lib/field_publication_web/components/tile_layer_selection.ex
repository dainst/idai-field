defmodule FieldPublicationWeb.Components.Map.TileLayerSelection do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document
  alias FieldPublication.DatabaseSchema.Publication

  attr(:publication, Publication, required: true)
  attr(:layers, :list, required: true)
  attr(:event_target, :string, required: true)
  slot(:inner_block, required: true)

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id}>
      <div :if={@document_layers ++ @project_layers != []}>
        <div
          class="rounded w-8 h-8 text-center pt-0.5 bg-white"
          phx-click={Phoenix.LiveView.JS.toggle(to: "##{@id}-layer-select")}
        >
          <.icon name="hero-square-3-stack-3d" />
        </div>
        <div
          id={"#{@id}-layer-select"}
          class="absolute mt-0.5 bg-white right-1 p-2 max-h-64 overflow-auto hidden"
        >
          <.render_tile_layer_selection_group
            event_target={@myself}
            publication={@publication}
            layers={@document_layers}
          >
            Document
          </.render_tile_layer_selection_group>
          <.render_tile_layer_selection_group
            event_target={@myself}
            publication={@publication}
            layers={@project_layers}
          >
            Project
          </.render_tile_layer_selection_group>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def update(
        %{
          id: my_id,
          map_id: map_id,
          publication: %Publication{} = publication
        } = assigns,
        socket
      ) do
    document_layer_infos = create_document_layer_infos(Map.get(assigns, :doc), publication)
    project_layer_infos = create_project_layer_infos(publication)

    {
      :ok,
      socket
      |> assign(:id, my_id)
      |> assign(:map_id, map_id)
      |> assign(:publication, publication)
      |> assign(:document_layers, document_layer_infos)
      |> assign(:project_layers, project_layer_infos)
      |> push_event("set-preference-target-#{map_id}", %{id: my_id})
      |> push_event("set-document-layers-#{map_id}", %{
        document_layers: document_layer_infos
      })
      |> push_event("set-project-layers-#{map_id}", %{
        project_layers: project_layer_infos
      })
    }
  end

  @impl true
  def handle_event(
        "toggle-layer",
        %{"uuid" => uuid, "show" => show_parameter},
        %{assigns: %{map_id: map_id}} = socket
      ) do
    value = show_parameter == "true"

    maybe_updated_project_layers =
      socket.assigns.project_layers
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, !state.visible)
        else
          state
        end
      end)

    maybe_updated_document_layers =
      socket.assigns.document_layers
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
      |> assign(:project_layers, maybe_updated_project_layers)
      |> assign(:document_layers, maybe_updated_document_layers)
      |> push_event("set-layer-visibility-#{map_id}", %{
        uuid: uuid,
        visibility: value
      })
    }
  end

  def handle_event(
        "visibility-preference",
        %{"uuid" => uuid, "show" => value},
        socket
      )
      when is_boolean(value) do
    # When a map background layer is loaded on the client side, the client side hook will
    # send this event if the client's localStorage contained a visibility preference for
    # the added layer.
    #
    # The client will have set the layer visibility at this point and uses this event to make
    # sure the server state is the same as in the client's browser.
    maybe_updated_project_layers =
      socket.assigns.project_layers
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, value)
        else
          state
        end
      end)

    maybe_updated_document_layers =
      socket.assigns.document_layers
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, value)
        else
          state
        end
      end)

    {
      :noreply,
      socket
      |> assign(:project_layers, maybe_updated_project_layers)
      |> assign(:document_layers, maybe_updated_document_layers)
    }
  end

  defp create_document_layer_infos(nil, _publication), do: []

  defp create_document_layer_infos(%Document{} = doc, %Publication{} = publication) do
    # "Default map layers" are supposed to be visibile immediately, while others are initialized hidden.
    default_map_layers =
      doc.default_map_layers
      |> Data.get_raw_documents(publication)
      |> Stream.map(&create_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: true})
      end)

    other_map_layers =
      doc.map_layers
      |> Data.get_raw_documents(publication)
      |> Stream.map(&create_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: false})
      end)
      |> Enum.reject(fn entry -> entry.uuid in doc.default_map_layers end)

    default_map_layers ++ other_map_layers
  end

  defp create_project_layer_infos(publication) do
    # TODO: Create a cached function in `Data` module?
    project_doc_relations =
      Data.get_raw_document("project", publication)
      |> Map.get("resource", %{})
      |> Map.get("relations", %{})

    default_map_layers =
      Map.get(project_doc_relations, "hasDefaultMapLayer", [])
      |> Data.get_raw_documents(publication)
      |> Stream.map(&create_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: true})
      end)

    other_map_layers =
      Map.get(project_doc_relations, "hasMapLayer", [])
      |> Data.get_raw_documents(publication)
      |> Stream.map(&create_tile_layer_info/1)
      |> Stream.map(fn layer_info ->
        Map.merge(layer_info, %{visible: false})
      end)
      |> Enum.reject(fn entry ->
        entry.uuid in Map.get(project_doc_relations, "hasDefaultMapLayer", [])
      end)

    default_map_layers ++ other_map_layers
  end

  defp create_tile_layer_info(%{
         "resource" => %{
           "georeference" => georeference,
           "height" => height,
           "width" => width,
           "id" => uuid,
           "identifier" => identifier
         }
       }) do
    %{
      geo_reference: georeference,
      height: height,
      width: width,
      uuid: uuid,
      identifier: identifier
    }
  end

  def render_tile_layer_selection_group(assigns) do
    ~H"""
    <%= if @layers != [] do %>
      <div class="font-semibold pb-2 grow">
        {render_slot(@inner_block)}
      </div>
      <%= for %{uuid: uuid, identifier: identifier, visible: visible} <- @layers do %>
        <div class="text-xs flex gap-0.5 items-center">
          <span
            class="cursor-pointer text-primary hover:text-primary-hover"
            phx-target={@event_target}
            phx-click="toggle-layer"
            phx-value-uuid={uuid}
            phx-value-show={"#{!visible}"}
          >
            <.icon class="w-5 h-5" name={if visible, do: "hero-eye", else: "hero-eye-slash"} />
          </span>
          <div class="grow text-nowrap">
            {identifier}
          </div>
          <.link patch={~p"/projects/#{@publication.project_identifier}/#{@publication.draft_date}/#{uuid}"}>
            <.icon class="w-5 h-5" name="hero-photo" />
          </.link>
        </div>
      <% end %>
    <% end %>
    """
  end
end
