defmodule FieldHub.Statistics do
  alias FieldHub.CouchService

  import CouchService.Credentials

  require Logger

  @variant_types Application.compile_env(:field_hub, :file_variant_types)

  def get_for_project(%CouchService.Credentials{} = credentials, project_name) do
    db_statistics = get_database_statistics(credentials, project_name)
    file_statistics = get_file_statistics(project_name)

    %{
      name: project_name,
      database: db_statistics,
      files: file_statistics
    }
  end

  def get_all(%CouchService.Credentials{} = credentials) do
    credentials
    |> FieldHub.CouchService.get_databases_for_user()
    |> Enum.map(&get_for_project(credentials, &1))
  end

  defp get_database_statistics(%CouchService.Credentials{} = credentials, project_name) do
    %{"doc_count" => db_doc_count, "sizes" => %{"file" => db_file_size}} =
      credentials
      |> FieldHub.CouchService.get_db_infos(project_name)

    %{doc_count: db_doc_count, file_size: db_file_size}
  end

  defp get_file_statistics(project_name) do
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
        |> Enum.reduce(
          Map.new(@variant_types, fn(type) ->
            {type, %{
              active: 0,
              active_size: 0,
              deleted: 0,
              deleted_size: 0
            }}
          end),
          fn({_uuid, %{deleted: deleted, variants: variants }}, accumulated_stats) ->
            variants
            |> Stream.map(fn(%{name: name, size: size}) ->
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
            |> Map.merge(accumulated_stats, fn(_key, current_uuid_variant_stats, accumulated_variant_stats) ->
              Map.merge(
                current_uuid_variant_stats,
                accumulated_variant_stats,
                fn(_key_b, counter_value_current, counter_value_accumulated) ->
                  counter_value_current + counter_value_accumulated
              end)
            end)
        end)
    end
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
