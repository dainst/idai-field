defmodule FieldHub.Statistics do
  alias FieldHub.CouchService

  import CouchService.Credentials

  require Logger

  @variant_types Application.compile_env(:field_hub, :file_variant_types)

  def get_for_project(project_name) do
    db_statistics = get_database_statistics(project_name)
    file_statistics = get_file_statistics(project_name)

    %{
      name: project_name,
      database: db_statistics,
      files: file_statistics
    }
  end

  def get_all(user_name) do
    user_name
    |> FieldHub.CouchService.get_databases_for_user()
    |> Enum.map(&get_for_project(&1))
  end

  defp get_database_statistics(project_name) do
    %{"doc_count" => db_doc_count, "sizes" => %{"file" => db_file_size}} =
      FieldHub.CouchService.get_db_infos(project_name)

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
          Map.new(@variant_types, fn type ->
            {type,
             %{
               active: 0,
               active_size: 0,
               deleted: 0,
               deleted_size: 0
             }}
          end),
          fn {_uuid, %{deleted: deleted, variants: variants}}, accumulated_stats ->
            variants
            |> Stream.map(fn %{name: name, size: size} ->
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
            |> Map.merge(accumulated_stats, fn _key,
                                               current_uuid_variant_stats,
                                               accumulated_variant_stats ->
              Map.merge(
                current_uuid_variant_stats,
                accumulated_variant_stats,
                fn _key_b, counter_value_current, counter_value_accumulated ->
                  counter_value_current + counter_value_accumulated
                end
              )
            end)
          end
        )
    end
  end
end
