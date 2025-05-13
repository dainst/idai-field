defmodule FieldHubWeb.Rest.Api.Rest.File do
  use FieldHubWeb, :controller

  alias File.Stat
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
         {:parsed_length, {:ok, expected_content_length}} <-
           {:parsed_length, parse_expected_content_length(conn)},
         {
           :io_opened,
           {
             {:ok, io_device},
             tmp_file_path
           }
         } <-
           {
             :io_opened,
             FileStore.create_write_io_device(uuid, project, parsed_type)
           },
         {
           :stream,
           {:ok, %Plug.Conn{} = conn}
         } <-
           {
             :stream,
             start_body_streaming(
               conn,
               io_device,
               tmp_file_path
             )
           },
         {:size_check, {:ok, :matches}} <-
           {:size_check, check_sizes(tmp_file_path, expected_content_length)} do
      FileStore.store_by_moving(uuid, project, parsed_type, tmp_file_path)

      FileStore.clear_cache(project)

      send_resp(conn, 201, Jason.encode!(%{info: "File created."}))
    else
      {:parsed_type, {:error, type}} ->
        send_resp(conn, 400, Jason.encode!(%{reason: "Unknown file type: #{type}"}))

      {:parsed_length, {:error, :missing_content_length_header}} ->
        send_resp(conn, 411, Jason.encode!(%{reason: "Missing content length header"}))

      {:parsed_length, {:error, :invalid_content_length_header}} ->
        send_resp(conn, 400, Jason.encode!(%{reason: "Invalid content length header"}))

      {:io_opened, posix} ->
        Logger.error(
          "Got `#{posix}` while trying to open file `#{uuid}` (#{type}) for project `#{project}`."
        )

        send_resp(conn, 500, Jason.encode!(%{reason: "Unable to write file."}))

      {:stream, {{:error, term}, path}} ->
        Logger.warning(
          "Got `#{term}` error while trying to stream request body for `#{uuid}` (#{type}) for project `#{project}`."
        )

        File.rm(path)

        send_resp(conn, 500, Jason.encode!(%{reason: "Unable to write file."}))

      {:size_check, {:error, path}} ->
        Logger.warning(
          "Temporary file for `#{uuid}` (#{type}) for project `#{project}` does not match expected size of content length header."
        )

        File.rm(path)

        send_resp(
          conn,
          417,
          Jason.encode!(%{
            reason: "Received file size does not match expected size of content length header."
          })
        )
    end
  end

  defp parse_expected_content_length(conn) do
    get_req_header(conn, "content-length")
    |> case do
      [] ->
        {:error, :missing_content_length_header}

      [string_value] ->
        Integer.parse(string_value)
        |> case do
          {value, ""} ->
            {:ok, value}

          _ ->
            {:error, :invalid_content_length_header}
        end
    end
  end

  defp start_body_streaming(conn, io_device, target_path) do
    parent = self()

    spawn(fn ->
      Process.monitor(parent)

      receive do
        {:DOWN, _ref, :process, _pid, {:shutdown, :local_closed}} ->
          Logger.warning(
            "File upload got interrupted for `#{target_path}`, deleting data received so far."
          )

          File.rm(target_path)
      end
    end)

    stream_body(conn, io_device, target_path)
  end

  @read_length Application.compile_env(:field_hub, :file_read_chunk_size_bytes, 8_000_000)
  defp stream_body(conn, io_device, path) do
    read_body(conn, length: @read_length)
    |> case do
      {:ok, data, conn} ->
        IO.binwrite(io_device, data)
        {:ok, conn}

      {:more, data, conn} ->
        IO.binwrite(io_device, data)
        stream_body(conn, io_device, path)

      error ->
        {error, path}
    end
  end

  defp check_sizes(file_path, expected_value) do
    File.stat(file_path)
    |> case do
      {:ok, %Stat{size: size}} ->
        if expected_value == size do
          {:ok, :matches}
        else
          {:error, file_path}
        end

      _ ->
        {:error, file_path}
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
