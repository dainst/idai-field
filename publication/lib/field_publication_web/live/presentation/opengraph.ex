defmodule FieldPublicationWeb.Presentation.Opengraph do
  import Phoenix.Component, only: [assign: 3]

  use FieldPublicationWeb, :html
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document
  alias FieldPublicationWeb.Components.Data.Image

  def add_opengraph_tags(socket, publication, doc) do
    socket
    |> assign(
      :page_image,
      create_image(doc, publication.project_name)
    )
    |> assign(
      :page_description,
      create_description(doc)
    )
  end

  defp create_description(doc) do
    Data.get_field_value(doc, "shortDescription")
    |> case do
      value when is_binary(value) ->
        value

      values when is_map(values) ->
        pick_default_translation(values)

      nil ->
        nil
    end
  end

  defp create_image(%Document{} = doc, project_name) do
    case List.first(doc.image_uuids) do
      nil ->
        nil

      first_image_uuid ->
        "#{FieldPublicationWeb.Endpoint.url()}/#{Image.construct_url(project_name, first_image_uuid)}"
    end
  end
end
