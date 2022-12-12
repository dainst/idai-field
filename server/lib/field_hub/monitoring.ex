defmodule FieldHub.Monitoring do
  alias FieldHub.CouchService

  import CouchService.Credentials

  require Logger

  @variant_types Application.compile_env(:field_hub, :file_variant_types)

  def statistics(%CouchService.Credentials{} = credentials) do
    credentials
    |> FieldHub.CouchService.get_db_infos()
    |> Enum.map(fn(%{
      "db_name" => db_name,
      "doc_count" => db_doc_count,
      "sizes" => %{
        "file" => db_file_size
      }}) ->
        %{db_name: db_name, db_doc_count: db_doc_count, db_file_size: db_file_size}
    end)
    |> Enum.map(fn(%{db_name: project_name} = db_info) ->
        try do
          FieldHub.FileStore.get_file_list(project_name)
        rescue
          e -> e
        end
        |> case do
          %File.Error{reason: :enoent} ->
            Map.merge(%{files: :enoent}, db_info)
          file_map ->
            summary = summarize_file_info(file_map)
            inconsistencies = get_image_file_inconsistencies(file_map)

            summary =
              summary
              |>Map.update!(:thumbnail_image, fn(val) ->
                Map.put(val, :missing, inconsistencies[:thumbnail_images_missing])
              end)
              |> Map.update!(:original_image, fn(val) ->
                Map.put(val, :missing, inconsistencies[:original_images_missing])
            end)

            Map.merge(%{files: summary}, db_info)
        end
    end)
  end

  defp get_image_file_inconsistencies(file_map) do
    file_map
    |> Enum.reduce(
      %{
        original_images_missing: [],
        thumbnail_images_missing: []
      },
      fn({uuid, %{deleted: deleted, variants: variants }}, acc) ->
        case deleted do
          true ->
            acc
          false ->
            present =
              variants
              |> Enum.map(fn(%{name: name}) ->
                name
              end)

            acc =
              if :thumbnail_image not in present and :original_image in present do
                Map.update!(acc, :thumbnail_images_missing, fn(existing) ->
                  existing ++ [uuid]
                end)
              else
                acc
            end

            if :thumbnail_image in present and :original_image not in present do
              Map.update!(acc, :original_images_missing, fn(existing) ->
                existing ++ [uuid]
              end)
            else
              acc
            end
        end
      end)
  end

  end

  defp summarize_file_info(file_info) do
    file_info
    |> Enum.reduce(
        Map.new(@variant_types, fn(type) ->
          {type, %{
            active: 0,
            active_size: 0,
            deleted: 0,
            deleted_size: 0
          }}
        end),
        fn({_uuid, %{deleted: deleted, variants: variants }}, acc) ->
          variants
          |> Enum.map(fn(%{name: name, size: size}) ->
            case deleted do
              true ->
                %{
                    name => %{
                    deleted: 1,
                    deleted_size: size
                  }
                }
              _ ->
                %{
                    name => %{
                    active: 1,
                    active_size: size
                  }
                }
            end
          end)
          |> Enum.reduce(&Map.merge/2)
          |> Map.merge(acc, fn(_key, val1, val2) ->
            Map.merge(val1, val2, fn(_key_b, val_inner_1, val_inner_2) ->
              val_inner_1 + val_inner_2
            end)
          end)
      end)
  end
end
