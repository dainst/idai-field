defmodule IdaiFieldServerWeb.FileSyncController do
  use IdaiFieldServerWeb, :controller

  def index(conn, %{"project" => project}) do
    IO.inspect project
    json(conn, %{project: project})
  end

  def list_images(dir) do 
    #if not File.dir?(dir) raise ""
    File.ls! dir
  end
end