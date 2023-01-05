defmodule FieldHubWeb.Api.FileView do
  use FieldHubWeb, :view

  def render("list.json", %{files: files}) do
    files
  end
end
