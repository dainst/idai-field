defmodule FieldPublicationWeb.Presentation.Data.Image do
  use Phoenix.Component

  @url Application.compile_env(:field_publication, :cantaloupe_url)

  def show(assigns) do
    ~H"""
    <img src={get_url(@project, @uuid)} />>
    """
  end

  defp get_url(project, uuid) do
    encoded_path =
      URI.encode("#{project}/#{uuid}")

    "#{@url}/iiif/3/#{encoded_path}.jp2"
  end
end
