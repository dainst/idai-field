defmodule FieldPublicationWeb.Presentation.Opengraph do
  import Phoenix.Component, only: [assign: 3]

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document
  alias FieldPublicationWeb.Presentation.Components.Image

  def add_opengraph_tags(socket, publication, doc, lang) do
    socket
    |> assign(
      :page_image,
      create_image(doc, publication.project_name)
    )
    |> assign(
      :page_description,
      create_description(doc, lang)
    )
  end

  defp create_description(doc, lang) do
    Data.get_field_value(doc, "shortDescription")
    |> case do
      value when is_binary(value) ->
        value

      value when is_map(value) ->
        Map.get(
          value,
          lang,
          Map.get(value, List.first(Map.keys(value)))
        )

      nil ->
        nil
    end
  end

  defp create_image(%Document{} = doc, project_name) do
    first_image_uuid = List.first(doc.image_uuids)

    "#{FieldPublicationWeb.Endpoint.url()}/#{Image.construct_url(%{uuid: first_image_uuid, project: project_name})}"
  end
end
