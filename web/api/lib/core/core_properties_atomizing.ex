defmodule Api.Core.CorePropertiesAtomizing do
  import Api.Core.Utils

  @core_properties [:groups, :relations, :shortDescription, :id, :type, :category, :identifier, :geometry, :gazId,
    :georeference, :parentId, :grandparentId, :featureVectors, :license, :shortName]

  def get_core_properties(), do: @core_properties

  @doc """
  Takes a document and changes map keys from strings to atoms
  where
    it is on the document level itself
    it is a resource core property
    it is a relation name

  supports nested documents, when relation targets are documents themselves
  """
  def format_document(document) do
    document
    |> atomize([:resource])
    |> atomize([:resource] ++ @core_properties, true)
    |> update_relations
  end

  def format_changes(changes) do
    changes
    |> atomize([:doc])
    |> atomize([:doc], true)
    |> Enum.map(&(update_in(&1, [:doc], fn doc -> format_document(doc) end)))
  end

  defp update_relations(document = %{ resource: resource }) do
    if not Map.has_key?(resource, :relations), do: document, else:
      update_in(document, [:resource, :relations],
         fn rel -> for {k, v} <- rel, into: %{} do
             {
               (if is_atom(k), do: k, else: String.to_atom(k)),
               (if is_list(v), do: Enum.map(v, &format_relation_target/1), else: v)
             }
           end
         end
       )
  end
  defp update_relations(document), do: document

  defp format_relation_target(target_document = %{ "resource" => _ }), do: format_document(target_document)
  defp format_relation_target(target_identifier), do: target_identifier
end
