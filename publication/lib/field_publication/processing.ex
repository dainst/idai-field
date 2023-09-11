defmodule FieldPublication.Processing do
  alias FieldPublication.Processing.Image

  def prepare_publication(project_key, publication_name) do
    Image.prepare_publication(project_key, publication_name)
  end
end
