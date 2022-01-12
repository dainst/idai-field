defmodule FieldHubWeb.Api.FileView do
  use FieldHubWeb, :view

  def render("list.json", %{file_names: file_names}) do
    file_names
  end
end
