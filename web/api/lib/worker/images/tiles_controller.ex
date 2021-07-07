defmodule Api.Worker.Images.TilesController do

  alias Api.Documents.Index
  alias Api.Worker.Images.TilesCreator

  def make_tiles(project) do
    %{ documents: docs } = Index.search(
      "*", 10000, 0, nil, nil, ["resource.georeference"], nil, nil, nil, [project]
    )
    Enum.map(docs, fn %{resource: %{ :id => id, "width" => width, "height" => height }} ->
      TilesCreator.create_tiles project, id, {width, height}
    end)
    { :finished, project }
  end
end
