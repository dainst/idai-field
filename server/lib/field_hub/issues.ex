defmodule FieldHub.Issues do

  alias FieldHub.CouchService

  defmodule Issue do
    @enforce_keys [:type, :severity, :data]
    defstruct [:type, :severity, :explanation, :data]
  end

  @severity_ranking [:info, :warning, :error]

  def check_file_store(credentials, project_name) do

    simple_issues =
      project_name
      |> FieldHub.FileStore.get_file_list()
      |> Enum.reduce(
        [],
        fn({_uuid, %{deleted: deleted}} = entry, acc) ->
          case deleted do
            true ->
              acc
            false ->
              acc
              |> check_missing_partners(entry)
              |> check_image_file_sizes(entry)
          end
        end)

    {database_enriched, others} =
      Enum.split_with(simple_issues, fn (%{type: type}) ->
        Enum.member?([:missing_thumbnail_image, :missing_original_image, :image_variant_sizes], type)
      end)

    # Details are retrieved from database in a single batch (instead of individually in the reduce above)
    # to avoid multiple CouchDB queries.
    database_enriched = add_database_details(database_enriched, credentials, project_name)

    database_enriched ++ others
    |> Enum.sort(fn(%{severity: severity_a}, %{severity: severity_b}) ->
      Enum.find_index(@severity_ranking, fn(val) -> val == severity_a end) > Enum.find_index(@severity_ranking, fn(val) -> val == severity_b end)
    end)
  end

  defp check_missing_partners(acc, {uuid, %{variants: variants}}) do
    present =
      variants
      |> Enum.map(fn(%{name: name}) ->
        name
      end)

    acc =
      if :thumbnail_image not in present and :original_image in present do
        acc ++ [%Issue{
          type: :missing_thumbnail_image,
          severity: :info,
          explanation: "Found original image file for #{uuid}, but missing corresponding thumbnail file.",
          data: %{
            uuid: uuid
          }
        }]
      else
        acc
    end

    acc =
      if :thumbnail_image in present and :original_image not in present do
        acc ++ [%Issue{
          type: :missing_original_image,
          severity: :info,
          explanation: "Found thumbnail image file for #{uuid}, but missing corresponding original file.",
          data: %{
            uuid: uuid
          }
        }]
      else
        acc
      end
    acc
  end

  defp check_image_file_sizes(acc, {uuid, %{variants: variants}}) do
    case variants do
      [
        %{name: :thumbnail_image, size: size_thumb},
        %{name: :original_image, size: size_original}
      ] when size_thumb >= size_original ->
        acc ++ [%Issue{
          type: :image_variant_sizes,
          severity: :warning,
          explanation: "#{uuid} has a thumbnail file that is as large as (or larger than) the original file.",
          data: %{
            uuid: uuid,
            size_thumb: size_thumb,
            size_original: size_original
          }
        }]
      _ ->
        acc
    end
  end

  defp add_database_details(acc, credentials, project_name) do

    uuids =
      acc
      |> Enum.map(fn(%{data: %{uuid: uuid}}) ->
        uuid
      end)

    detailed_data =
      CouchService.get_docs(credentials, project_name, uuids)
      |> Enum.map(&parse_file_documents/1)

    Enum.zip_with(acc, detailed_data, fn(val_acc, val_data) ->
      case val_data do
        %{error: :deleted, uuid: _uuid} ->
          msg = "#{Map.get(val_acc, :explanation)} The document was already marked as deleted in the database."
          val_acc
          |> Map.replace(:severity, :warning)
          |> Map.replace(:explanation, msg)

        %{error: :not_found, uuid: _uuid} ->
          msg = "#{Map.get(val_acc, :explanation)} The document was not found in the database (not even marked as deleted)."
          val_acc
          |> Map.replace(:severity, :error)
          |> Map.replace(:explanation, msg)

        %{created: created, created_by: created_by, file_name: file_name, file_type: file_type} = updated_data ->
          val_acc
          |> Map.replace(
              :explanation,
              "#{Map.get(val_acc, :explanation)} Added as #{file_name} (#{file_type}) " <>
              "by #{created_by} on #{created}."
            )
          |> Map.replace(:data, updated_data)
      end
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
