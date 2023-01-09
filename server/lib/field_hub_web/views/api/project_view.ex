defmodule FieldHubWeb.Api.ProjectView do
  use FieldHubWeb, :view

  def render("list.json", %{projects: projects}) do
    projects
  end

  def render("show.json", %{project: project}) do
    project
  end
end
