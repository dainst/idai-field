defmodule FieldHubWeb.Api.FileController do
  use FieldHubWeb, :controller

  alias FieldHub.FileStore
  alias FieldHubWeb.Api.StatusView

  @max_size Application.compile_env(:field_hub, :file_max_size)

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
        |> put_view(StatusView)
        |> render(%{error: msg})

      valid ->
        file_store_data =
          project
          |> Zarex.sanitize()
          |> FileStore.file_index(valid)

        render(conn, "list.json", %{files: file_store_data})
    end
  end

  def index(conn, %{"project" => _project, "types" => types}) do
    conn
    |> put_status(:bad_request)
    |> put_view(StatusView)
    |> render(%{error: "Invalid 'types' parameter: '#{types}'."})
  end

  def index(conn, %{"project" => project}) do
    file_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.file_index()

    render(conn, "list.json", %{files: file_store_data})
  end

  def show(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type = parse_type(type)

    case parsed_type do
      {:error, type} ->
        conn
        |> put_status(:bad_request)
        |> put_view(StatusView)
        |> render(%{error: "Unknown file type: #{type}"})

      valid ->
        FileStore.get_file_path(
          Zarex.sanitize(uuid),
          Zarex.sanitize(project),
          valid
        )
        |> case do
          {:error, :enoent} ->
            conn
            |> put_status(:not_found)
            |> put_view(StatusView)
            |> render(%{error: "Requested file not found"})

          {:ok, file_path} ->
            Plug.Conn.send_file(conn, 200, file_path)
        end
    end
  end

  def show(conn, _) do
    conn
    |> put_status(:bad_request)
    |> put_view(StatusView)
    |> render(%{error: "Bad request"})
  end

  def update(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type = parse_type(type)

    conn
    |> read_body(length: @max_size)
    |> case do
      {:ok, data, conn} ->
        case parsed_type do
          {:error, type} ->
            conn
            |> put_status(:bad_request)
            |> put_view(StatusView)
            |> render(%{error: "Unknown file type: #{type}"})

          valid ->
            FileStore.store(Zarex.sanitize(uuid), Zarex.sanitize(project), valid, data)

            conn
            |> put_status(:created)
            |> put_view(StatusView)
            |> render(%{info: "File created."})
        end

      {:more, _partial_body, conn} ->
        conn
        |> put_status(:request_entity_too_large)
        |> put_view(StatusView)
        |> render(%{
          error: "Payload to large, maximum of #{Sizeable.filesize(@max_size)} bytes allowed."
        })
    end
  end

  def delete(conn, %{"project" => project, "id" => uuid}) do
    file_store_data = FileStore.discard(Zarex.sanitize(uuid), Zarex.sanitize(project))

    conn
    |> put_view(StatusView)
    |> render(%{info: file_store_data})
  end

  defp parse_type("thumbnail_image") do
    :thumbnail_image
  end

  defp parse_type("original_image") do
    :original_image
  end

  defp parse_type(type) do
    {:error, type}
  end
end
