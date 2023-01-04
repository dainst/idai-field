defmodule FieldHubWeb.Api.StatusView do
  use FieldHubWeb, :view

  def render(_, %{error: info}) do
    %{reason: info}
  end

  def render(_, %{info: info}) do
    %{info: info}
  end
end
