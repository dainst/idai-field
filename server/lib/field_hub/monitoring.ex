defmodule FieldHub.Monitoring do
  alias FieldHub.CouchService

  import CouchService.Credentials

  require Logger

  @variant_types Application.compile_env(:field_hub, :file_variant_types)

  def statistics(%CouchService.Credentials{} = credentials, project_name) do
    db_statistics =
      credentials
      |> FieldHub.CouchService.get_db_infos(project_name)
      |> parse_db_metadata()

    file_statistics =
      project_name
      |> get_file_info()

    %{
      name: project_name,
      database: db_statistics,
      files: file_statistics
    }
  end

  def statistics(%CouchService.Credentials{} = credentials) do
    credentials
    |> FieldHub.CouchService.get_databases_for_user()
    |> Enum.map(&statistics(credentials, &1))
  end

  defp parse_db_metadata(%{"doc_count" => db_doc_count, "sizes" => %{"file" => db_file_size}}) do
    %{doc_count: db_doc_count, file_size: db_file_size}
  end

  defp get_file_info(project_name) do
    try do
      FieldHub.FileStore.get_file_list(project_name)
    rescue
      e -> e
    end
    |> case do
      %File.Error{reason: :enoent} ->
        :enoent
      file_info ->
        file_info
        |> summarize_file_info()
    end
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
                  existing ++ [%{uuid: uuid}]
                end)
              else
                acc
            end

            if :thumbnail_image in present and :original_image not in present do
              Map.update!(acc, :original_images_missing, fn(existing) ->
                existing ++ [%{uuid: uuid}]
              end)
            else
              acc
            end
        end
      end)
  end

  def detailed_statistics(%CouchService.Credentials{} = credentials, project_name) do
    statistics(credentials, project_name)
    |> Map.update!(:files, fn(variants) ->
      Enum.map(variants, fn({name, %{missing: missing} = values}) ->
        case missing do
          [] ->
            {name, values}
          entries ->
            detailed_missing =
              CouchService.get_docs(credentials, project_name, Enum.map(entries, fn(entry) ->
                entry[:uuid]
              end))
              |> Enum.map(&parse_file_documents(&1))

            {name, Map.put(values, :missing, detailed_missing)}
        end
      end)
      |> Enum.into(%{})
    end)
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

  # Only one document
  defp parse_file_documents(%{"id" => uuid, "docs" => [%{
    "ok" => %{
      "created" => %{
        "date" => date,
        "user" => user
      },
      "resource" => %{
        "identifier" => file_name,
        "type" => file_type
      }
    }
    }]}) do
      %{
        uuid: uuid,
        created: date,
        created_by: user,
        file_name: file_name,
        file_type: file_type
      }
  end

  # Only one error document
  defp parse_file_documents(%{"id" => uuid, "docs" => [%{
    "error" => %{
      "error" => "not_found"
    }
  }]}) do
    %{
      uuid: uuid,
      error: :not_found
    }
  end

  # Only one error document
  defp parse_file_documents(%{"id" => uuid, "docs" => [%{
    "ok" => %{"_deleted" => true}
  }]}) do
    %{
      uuid: uuid,
      error: :deleted
    }
  end

  # Evaluate handle all other cases
  defp parse_file_documents(%{"id" => uuid, "docs" => doc_list}) do

    deleted_doc =
      doc_list
      |> Enum.filter(fn val ->
        case val do
          %{"ok" => %{"_deleted" => true}} ->
            true
          _ ->
            false
        end
      end)

    case Enum.count(deleted_doc) do
      val when val > 0 ->
        %{
          uuid: uuid,
          error: :deleted
        }
      _ ->
        %{
          uuid: uuid,
          error: :unknown
        }
    end
  end
end
