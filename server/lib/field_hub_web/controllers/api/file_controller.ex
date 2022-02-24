defmodule FieldHubWeb.Api.FileController do
  use FieldHubWeb, :controller

  alias FieldHub.FileStore
  alias FieldHubWeb.ErrorView

  def index(conn, %{"project" => project, "types" => types}) when is_list(types) do
    parsed_types =
      types
      |> Enum.map(&parse_type/1)

    parsed_types
      |> Enum.filter(fn(val) ->
        case val do
          {:error, _} ->
            true
          _ ->
            false
        end
      end)
      |> case do
        [] ->
          parsed_types
        errors ->
          errors
          |> Enum.reduce({:error, "Unknown file types: "}, fn({:error, type}, {:error, acc}) ->
              {:error, "#{acc} '#{type}'"}
            end
          )
        end
      |> case do
        {:error, msg} ->
          conn
          |> put_view(ErrorView)
          |> render("400.json", message: msg)
        [] ->
          conn
          |> index(project)
        valid ->
          valid
      end

    image_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.get_file_list(parsed_types)

    render(conn, "list.json", %{files: image_store_data})
  end

  def index(conn, %{"project" => _project, "types" => types}) do

    conn
    |> put_view(ErrorView)
    |> render("400.json", message: "Invalid 'types' parameter: '#{types}'.")
  end

  # Default to type original_image if none provided.
  def index(conn, %{"project" => project}) do

    image_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.get_file_list()

    render(conn, "list.json", %{files: image_store_data})
  end

  def show(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type =
      parse_type(type)

    image_store_data =
      case parsed_type do
        {:error, type} ->
          conn
          |> put_view(ErrorView)
          |> render("400.json", message: "Unknown file types: #{type}")
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

  def update(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type =
      parse_type(type)

    {:ok, data, conn} = read_body(conn, length: 100_000_000)

    image_store_data =
      case parsed_type do
        {:error, type} ->
          conn
          |> put_view(ErrorView)
          |> render("400.json", message: "Unknown file type: #{type}")
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

  def delete(conn, %{"project" => project, "id" => uuid}) do

    image_store_data = FileStore.delete(%{uuid: Zarex.sanitize(uuid) , project: Zarex.sanitize(project)})

    case image_store_data do
      :ok ->
        conn
        |> put_view(ErrorView)
        |> render("200.json")
      _errors ->
        conn
        |> put_view(ErrorView)
        |> render("500.json")
    end
  end

  defp parse_type(type) do
    case type do
      "thumbnail_image" ->
        :thumbnail_image
      "original_image" ->
        :original_image
      _ ->
        {:error, type}
    end
  end
end
