defmodule FieldHub.Issues do
  alias FieldHub.FileStore
  alias FieldHub.CouchService

  defmodule Issue do
    @enforce_keys [:type, :severity, :data]
    defstruct [:type, :severity, :data]
  end

  @severity_ranking [:info, :warning, :error]

  require Logger

  def evaluate_all(project_name) do
    Enum.concat([
      evaluate_project_document(project_name),
      evaluate_images(project_name),
      evaluate_identifiers(project_name),
      evaluate_relations(project_name)
    ])
    |> sort_issues_by_decreasing_serverity()
  end

  def evaluate_project_document(project_name) do
    project_name
    |> CouchService.get_docs_by_category(["Project"])
    |> Enum.to_list()
    |> case do
      [] ->
        [%Issue{type: :no_project_document, severity: :error, data: %{}}]

      [%{"resource" => resource}] ->
        case resource do
          %{"relations" => %{"hasDefaultMapLayer" => []}} ->
            [%Issue{type: :no_default_project_map_layer, severity: :info, data: %{}}]

          %{"relations" => %{"hasDefaultMapLayer" => _values}} ->
            []

          _ ->
            [%Issue{type: :no_default_project_map_layer, severity: :info, data: %{}}]
        end
    end
  end

  def evaluate_images(project_name) do
    try do
      project_name
      |> FileStore.get_file_list()
    rescue
      e -> e
    end
    |> case do
      %File.Error{reason: :enoent, path: path} ->
        [
          %Issue{
            type: :file_directory_not_found,
            severity: :error,
            data: %{path: path}
          }
        ]

      file_store_data ->
        project_name
        |> CouchService.get_docs_by_category(
          ["Image", "Photo", "Drawing"] ++ get_custom_image_categories(project_name)
        )
        |> Stream.map(fn %{
                           "created" => %{
                             "user" => created_by,
                             "date" => created
                           },
                           "resource" => %{
                             "id" => uuid,
                             "type" => type,
                             "identifier" => file_name
                           }
                         } ->
          issue_data = %{
            uuid: uuid,
            file_type: type,
            file_name: file_name,
            created_by: created_by,
            created: created
          }

          file_store_data
          |> Map.get(uuid)
          |> case do
            nil ->
              # Image data completely missing for document uuid.
              %Issue{
                type: :missing_original_image,
                severity: :info,
                data: issue_data
              }

            %{variants: [%{name: :thumbnail_image}]} ->
              # Only thumbnail present for document uuid.
              %Issue{
                type: :missing_original_image,
                severity: :info,
                data: issue_data
              }

            %{variants: [_, _] = variants} ->
              # If two variants (thumbnail and original) are present, check their sizes.
              thumbnail_size =
                variants
                |> Enum.find(fn %{name: variant_name} ->
                  variant_name == :thumbnail_image
                end)
                |> Map.get(:size)

              original_size =
                variants
                |> Enum.find(fn %{name: variant_name} ->
                  variant_name == :original_image
                end)
                |> Map.get(:size)

              case thumbnail_size do
                val when val >= original_size ->
                  # Original image files should not be smaller than thumbnails.
                  %Issue{
                    type: :image_variants_size,
                    severity: :warning,
                    data:
                      Map.merge(
                        issue_data,
                        %{original_size: original_size, thumbnail_size: thumbnail_size}
                      )
                  }

                _ ->
                  # Otherwise :ok.
                  :ok
              end

            _ ->
              # Only original image found is :ok.
              :ok
          end
        end)
        |> Enum.reject(fn val ->
          case val do
            :ok -> true
            _ -> false
          end
        end)
    end
  end

  defp get_custom_image_categories(project_name) do
    project_name
    |> CouchService.get_docs_by_category(["Configuration"])
    |> Enum.to_list()
    |> case do
      [configuration] ->
        configuration["resource"]["forms"]
        |> Enum.map(fn {key, value} ->
          case value do
            %{"parent" => "Image"} ->
              key

            _ ->
              :reject
          end
        end)
        |> Enum.reject(fn val -> val == :reject end)

      _ ->
        []
    end
  end

  def evaluate_identifiers(project_name) do
    query = %{
      selector: %{},
      fields: [
        "_id",
        "resource.identifier"
      ]
    }

    CouchService.get_find_query_stream(project_name, query)
    |> Enum.group_by(fn %{"resource" => %{"identifier" => identifier}} ->
      identifier
    end)
    |> Enum.filter(fn {_identifier, documents} ->
      case documents do
        [_single_doc] ->
          false

        _multiple_docs ->
          true
      end
    end)
    |> case do
      [] ->
        []

      groups ->
        Enum.map(groups, fn {identifier, docs} ->
          ids = Enum.map(docs, fn %{"_id" => id} -> id end)

          detailed_docs =
            CouchService.get_docs(project_name, ids)
            |> Enum.to_list()

          %Issue{
            type: :non_unique_identifiers,
            severity: :error,
            data: %{identifier: identifier, documents: detailed_docs}
          }
        end)
    end
  end

  def evaluate_relations(project_name) do
    query = %{
      selector: %{},
      fields: [
        "_id",
        "resource.relations"
      ]
    }

    relations =
      CouchService.get_find_query_stream(project_name, query)
      |> Enum.map(fn %{"_id" => uuid, "resource" => %{"relations" => relations}} ->
        referenced_uuids =
          relations
          |> Enum.map(fn {_relation_type_key, uuids} ->
            uuids
          end)
          |> List.flatten()
          |> Enum.uniq()

        {uuid, referenced_uuids}
      end)

    all_uuids =
      Enum.map(relations, fn {uuid, _relations} ->
        uuid
      end)

    Enum.map(relations, fn {uuid, current_relations} ->
      case current_relations -- all_uuids do
        [] ->
          :ok

        unresoved_relations ->
          %Issue{
            type: :unresolved_relation,
            severity: :error,
            data: %{uuid: uuid, unresolved_relations: unresoved_relations}
          }
      end
    end)
    |> Enum.reject(fn val -> val == :ok end)
  end

  def sort_issues_by_decreasing_serverity(issues) do
    issues
    |> Enum.sort(fn %{severity: severity_a}, %{severity: severity_b} ->
      Enum.find_index(
        @severity_ranking,
        fn val -> val == severity_a end
      ) >
        Enum.find_index(
          @severity_ranking,
          fn val -> val == severity_b end
        )
    end)
  end
end
