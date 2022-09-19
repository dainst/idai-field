defmodule FieldHubWeb.Api.FileController do
  use FieldHubWeb, :controller

  alias FieldHub.FileStore
  alias FieldHubWeb.ErrorView

  def index(conn, %{"project" => project, "types" => types}) when is_list(types) do
    parsed_types =
      types
      |> Enum.map(&parse_type/1)

    parsed_types =
      parsed_types
      |> Enum.filter(fn val ->
        case val do
          {:error, _} ->
            true

          _ ->
            false
        end
      end)
      |> case do
        [] ->
          # No errors found in parsed_types, return parsed_types list as-is
          parsed_types

        errors ->
          # Reduce all errors to a single {:error, msg} tuple.
          errors
          |> Enum.reduce({:error, "Unknown file types: "}, fn {:error, type}, {:error, acc} ->
            {:error, "#{acc} '#{type}'"}
          end)
      end

    case parsed_types do
      {:error, msg} ->
        conn
        |> put_status(:bad_request)
        |> put_view(ErrorView)
        |> render("400.json", message: msg)

      [] ->
        # 'types' parameter was present but empty. Handle like a request without 'types' parameter (all files are returned).
        conn
        |> index(%{"project" => project})

      valid ->
        file_store_data =
          project
          |> Zarex.sanitize()
          |> FileStore.get_file_list(valid)

        render(conn, "list.json", %{files: file_store_data})
    end
  end

  def index(conn, %{"project" => _project, "types" => types}) do
    conn
    |> put_status(:bad_request)
    |> put_view(ErrorView)
    |> render("400.json", message: "Invalid 'types' parameter: '#{types}'.")
  end

  def index(conn, %{"project" => project}) do
    file_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.get_file_list()

    render(conn, "list.json", %{files: file_store_data})
  end

  def show(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type = parse_type(type)

    case parsed_type do
      {:error, type} ->
        conn
        |> put_status(:bad_request)
        |> put_view(ErrorView)
        |> render("400.json", message: "Unknown file type: #{type}")

      valid ->
        FileStore.get_file_path(%{
          uuid: Zarex.sanitize(uuid),
          project: Zarex.sanitize(project),
          type: valid
        })
        |> case do
          {:error, :enoent} ->
            conn
            |> put_status(:not_found)
            |> put_view(ErrorView)
            |> render("404.json")

          {:ok, file_path} ->
            Plug.Conn.send_file(conn, 200, file_path)
        end
    end
  end

  def show(conn, _) do
    conn
    |> put_status(:bad_request)
    |> put_view(ErrorView)
  end

  def update(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type =
      parse_type(type)

    max_payload = 1_000_000_000

    conn
    |> read_body(length: max_payload)
    |> case do
      {:ok, data, conn} ->
        file_store_data =
          case parsed_type do
            {:error, type} ->
              conn
              |> put_status(:bad_request)
              |> put_view(ErrorView)
              |> render("400.json", message: "Unknown file type: #{type}")
            valid ->
              FileStore.store_file(%{uuid: Zarex.sanitize(uuid) , project: Zarex.sanitize(project), type: valid, content: data})
          end

        case file_store_data do
          :ok ->
            conn
            |> put_status(:created)
            |> put_view(ErrorView)
            |> render("201.json")
          {:error, _} ->
            conn
            |> put_status(:internal_server_error)
            |> put_view(ErrorView)
            |> render("500.json")
        end
      {:more, _partial_body, conn} ->
        conn
        |> put_status(:request_entity_too_large)
        |> put_view(ErrorView)
        |> render("413.json", message: "Payload to large, maximum of #{max_payload} bytes allowed.")
    end
  end

  def delete(conn, %{"project" => project, "id" => uuid}) do

    file_store_data = FileStore.delete(%{uuid: Zarex.sanitize(uuid) , project: Zarex.sanitize(project)})

    case file_store_data do
      :ok ->
        conn
        |> put_view(ErrorView)
        |> render("200.json")
      _errors ->
        conn
        |> put_status(:internal_server_error)
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
