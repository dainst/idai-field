defmodule FieldHubWeb.Api.FileController do
  use FieldHubWeb, :controller

  alias FieldHub.FileStore
  alias FieldHubWeb.ErrorView

  def index(conn, %{"project" => project, "type" => type}) do
    parsed_type =
      parse_type(type)
      |> case do
        {:error, msg} ->
          conn
          |> put_view(ErrorView)
          |> render("400.json", message: msg)
        valid ->
          valid
      end

    image_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.get_file_list([parsed_type])

    render(conn, "list.json", %{files: image_store_data})
  end

  # Default to type original_image if none provided.
  def index(conn, %{"project" => project}) do

    image_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.get_file_list()

    render(conn, "list.json", %{files: image_store_data})
  end

  def show(conn, %{"project" => project, "id" => uuid, "type" => type}) do
    parsed_type =
      parse_type(type)

    image_store_data =
      case parsed_type do
        {:error, msg} ->
          conn
          |> put_view(ErrorView)
          |> render("400.json", message: msg)
        valid ->
          FileStore.get_file_path(%{uuid: Zarex.sanitize(uuid) , project: Zarex.sanitize(project), type: valid})
      end

    case image_store_data do
      {:error, :enoent} ->
        conn
        |> put_view(ErrorView)
        |> render("404.json")
      {:ok, file_path} ->
        Plug.Conn.send_file(conn, 200, file_path)
    end
  end

  def update(conn, %{"project" => project, "id" => uuid, "type" => type}) do
    parsed_type =
      parse_type(type)

    {:ok, data, conn} = read_body(conn, length: 100_000_000)

    image_store_data =
      case parsed_type do
        {:error, msg} ->
          conn
          |> put_view(ErrorView)
          |> render("400.json", message: msg)
        valid ->
          FileStore.store_file(%{uuid: Zarex.sanitize(uuid) , project: Zarex.sanitize(project), type: valid, content: data})
      end

    case image_store_data do
      :ok ->
        conn
        |> put_view(ErrorView)
        |> render("201.json")
      {:error, _} ->
        conn
        |> put_view(ErrorView)
        |> render("500.json")
    end
  end

  def delete(conn, %{"project" => project, "id" => uuid, "type" => type}) do
    parsed_type =
      parse_type(type)

    image_store_data =
      case parsed_type do
        {:error, msg} ->
          conn
          |> render(ErrorView, "400.json", message: msg)
        valid ->
          FileStore.delete(%{uuid: Zarex.sanitize(uuid) , project: Zarex.sanitize(project), type: valid})
      end

    case image_store_data do
      :ok ->
        conn
        |> render(ErrorView, "200.json")
      {:error, _} ->
        conn
        |> render(ErrorView, "500.json")
    end
  end

  defp parse_type(type) do
    case type do
      "thumbnail_image" ->
        :thumbnail_image
      "original_image" ->
        :original_image
      _ ->
        {:error, "Unknown file type: '#{type}'."}
    end
  end
end
