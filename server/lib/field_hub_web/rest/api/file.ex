defmodule FieldHubWeb.Rest.Api.Rest.File do
  use FieldHubWeb, :controller

  alias FieldHub.FileStore

  require Logger

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
        send_resp(conn, 400, Jason.encode!(%{reason: msg}))

      valid ->
        file_store_data =
          project
          |> Zarex.sanitize()
          |> FileStore.file_index(valid)

        send_resp(conn, 200, Jason.encode!(file_store_data))
    end
  end

  def index(conn, %{"project" => _project, "types" => types}) do
    send_resp(conn, 400, Jason.encode!(%{reason: "Invalid 'types' parameter: '#{types}'."}))
  end

  def index(conn, %{"project" => project}) do
    file_store_data =
      project
      |> Zarex.sanitize()
      |> FileStore.file_index()

    send_resp(conn, 200, Jason.encode!(file_store_data))
  end

  def show(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    parsed_type = parse_type(type)

    case parsed_type do
      {:error, type} ->
        send_resp(conn, 400, Jason.encode!(%{reason: "Unknown file type: #{type}"}))

      valid ->
        FileStore.get_file_path(
          Zarex.sanitize(uuid),
          Zarex.sanitize(project),
          valid
        )
        |> case do
          {:error, :enoent} ->
            send_resp(conn, 404, Jason.encode!(%{reason: "Requested file not found"}))

          {:ok, file_path} ->
            send_file(conn, 200, file_path)
        end
    end
  end

  def show(conn, _) do
    send_resp(conn, 400, Jason.encode!(%{reason: "Bad request"}))
  end

  def update(conn, %{"project" => project, "id" => uuid, "type" => type}) when is_binary(type) do
    with {:parsed_type, parsed_type} when is_atom(parsed_type) <-
           {:parsed_type, parse_type(type)},
         {:io_opened, {:ok, io_device}} <-
           {:io_opened, FileStore.create_write_io_device(uuid, project, parsed_type)},
         {:stream, {:ok, %Plug.Conn{} = conn}} <- {:stream, stream_body(conn, io_device)} do
      FileStore.clear_cache(project)

      send_resp(conn, 201, Jason.encode!(%{info: "File created."}))
    else
      {:parsed_type, {:error, type}} ->
        send_resp(conn, 400, Jason.encode!(%{reason: "Unknown file type: #{type}"}))

      {:io_opened, posix} ->
        Logger.error(
          "Got `#{posix}` while trying to open file `#{uuid}` (#{type}) for project `#{project}`."
        )

        send_resp(conn, 500, Jason.encode!(%{reason: "Unable to write file."}))

      {:stream, {:error, term}} ->
        Logger.error(
          "Got `#{term}` error while trying to stream request body for `#{uuid}` (#{type}) for project `#{project}`."
        )

        FileStore.get_file_path(uuid, project, parse_type(type))
        |> case do
          {:ok, path} -> File.rm(path)
          _ -> :ok
        end

        send_resp(conn, 500, Jason.encode!(%{reason: "Unable to write file."}))
    end
  end

  defp stream_body(conn, io_device) do
    read_body(conn)
    |> case do
      {:ok, data, conn} ->
        IO.binwrite(io_device, data)
        {:ok, conn}

      {:more, data, conn} ->
        IO.binwrite(io_device, data)
        stream_body(conn, io_device)

      error ->
        error
    end
  end

  def delete(conn, %{"project" => project, "id" => uuid}) do
    file_store_data = FileStore.discard(Zarex.sanitize(uuid), Zarex.sanitize(project))

    send_resp(conn, 200, Jason.encode!(%{info: file_store_data}))
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
