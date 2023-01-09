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
      evaluate_images(project_name)
    ])
    |> sort_issues_by_decreasing_serverity()
  end

  def evaluate_project_document(project_name) do
    project_name
    |> CouchService.get_docs_by_type(["Project"])
    |> Enum.to_list()
    |> case do
      [] ->
        [%Issue{type: :no_project_document, severity: :error, data: %{}}]

      [%{"resource" => %{"relations" => relations}}] ->
        case relations do
          %{"hasDefaultMapLayer" => []} ->
            [%Issue{type: :no_default_project_map_layer, severity: :info, data: %{}}]

          %{"hasDefaultMapLayer" => _values} ->
            []

          _ ->
            [%Issue{type: :no_default_project_map_layer, severity: :info, data: %{}}]
        end

      _ ->
        [%Issue{type: :multiple_project_documents, severity: :error, data: %{}}]
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
        |> CouchService.get_docs_by_type(["Image", "Photo", "Drawing"])
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
