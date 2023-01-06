defmodule FieldHubWeb.Api.FileView do
  use FieldHubWeb, :view

  def render(_, %{files: files}) do
    files
  end

  def render(_, %{error: reason}) do
    %{reason: reason}
  end
end
