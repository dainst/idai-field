defmodule FieldPublicationWeb.Presentation.Opengraph do
  use FieldPublicationWeb, :html

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  alias FieldPublicationWeb.Components.Data.Image

  def add_opengraph_tags(socket, %Publication{} = publication, %Document{} = doc) do
    socket
    |> assign(
      :page_description,
      create_description(doc)
    )
    |> assign(
      :page_images,
      create_images(doc, publication.project_name)
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

  defp create_images(doc, project_name) do
    Enum.map(doc.image_uuids, fn uuid ->
      %{
        url: "#{FieldPublicationWeb.Endpoint.url()}/#{Image.construct_url(project_name, uuid)}",
        width: Image.get_default_width(),
        format: Image.get_default_format()
      }
    end)
  end
end
