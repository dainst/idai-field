defmodule FieldHub.Issues do
  alias FieldHub.FileStore
  alias FieldHub.CouchService

  @severity_ranking [:info, :warning, :error]

  defmodule Issue do
    @moduledoc """
    Simple struct for Issues.

    __Keys__
    - `type` an atom identifying the issue type.
    - `severity` severity of the issue, one of `[:info, :warning, :error]`.
    - `data` is expected to be a #{Map}, with arbitrary values that may provide some metadata concerning the Issue.
    """
    @enforce_keys [:type, :severity, :data]
    defstruct [:type, :severity, :data]
  end

  require Logger

  @moduledoc """
  Bundles a suite of evaluation functions that search for issues within projects.

  FieldHub concerns itself only with issues that can be derived from checking the projects' configurations.
  """

  @doc """
  Runs all defined evaluation functions on a project and returns a combined list of #{Issue}.

  __Parameters__
  - `project_name` the project's name.
  """
  def evaluate_all(project_name) do
    try do
      [
        evaluate_project_document(project_name),
        evaluate_images(project_name),
        evaluate_identifiers(project_name),
        evaluate_relations(project_name)
      ]
      |> Enum.concat()
    rescue
      e ->
        stack_trace = Exception.format(:error, e, __STACKTRACE__)
        Logger.error("Unexpected error while evaluation project '#{project_name}':")
        Logger.error(stack_trace)

        [
          %Issue{
            type: :unexpected_error,
            severity: :error,
            data: %{
              stack_trace: String.split(stack_trace, "\n")
            }
          }
        ]
    end
  end

  @doc """
  Checks if project's `project` document is present, and if a default map layer has been set. The latter can be used
  downstream by other applications as a default map background.

  __Parameters__
  - `project_name` the project's name.
  """
  def evaluate_project_document(project_name) do
    project_name
    |> CouchService.get_docs(["project"])
    |> case do
      [{:error, %{reason: "not_found"}}] ->
        [
          %Issue{
            type: :no_project_document,
            severity: :error,
            data: %{reason: "Document with id 'project' not found."}
          }
        ]

      [{:ok, %{"_deleted" => true} = _doc}] ->
        [
          %Issue{
            type: :no_project_document,
            severity: :error,
            data: %{reason: "Document with id 'project' got deleted at some point."}
          }
        ]

      [{:ok, %{"resource" => resource} = _doc}] ->
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

  @doc """
  Checks if all original images have been uploaded and compares thumbnail and original image file sizes (original images are
  expected to be larger in general).

  __Parameters__
  - `project_name` the project's name.
  """
  def evaluate_images(project_name) do
    try do
      project_name
      |> FileStore.file_index()
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
                             "category" => category,
                             "identifier" => file_name
                           }
                         } ->
          issue_data = %{
            uuid: uuid,
            file_type: category,
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

  @doc """
  Checks for non unique `identifier` values.

  Every document in a Field project should have a unique value in `resource.identifier`. There may be some rare edge cases
  where two documents get the same identifier when two users create them separately. FieldHub as the central syncing target
  checks for these cases.

  __Parameters__
  - `project_name` the project's name.
  """
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
            |> Enum.map(fn {:ok, doc} ->
              doc
            end)

          %Issue{
            type: :non_unique_identifiers,
            severity: :error,
            data: %{identifier: identifier, documents: detailed_docs}
          }
        end)
    end
  end

  @doc """
  Checks for unresolveable relations between documents.

  Historically, unresolveable relations were created by accident while directly manipulating the database (basically: deleting documents
  not through the Field Desktop application, but directly in CouchDB/PouchDB).

  __Parameters__
  - `project_name` the project's name.
  """
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

    Stream.map(relations, fn {uuid, current_relations} ->
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

  @doc """
  Sorts a list of issues by severity in the order `#{inspect(Enum.reverse(@severity_ranking))}`.

  __Parameters__
  - `issues` the list of issues.
  """
  def sort(issues) do
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
