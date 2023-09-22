defimpl Jason.Encoder,
  for: [
    FieldPublication.Schemas.Project,
    FieldPublication.Schemas.Publication
  ] do
  def encode(document, opts) do
    document
    |> Map.from_struct()
    |> Map.reject(fn {k, v} -> k == :_rev and is_nil(v) end)
    |> Map.put(
      :_id,
      FieldPublication.Schemas.construct_doc_id(document, get_module(document))
    )
    |> Jason.Encode.map(opts)
  end

  defp get_module(%FieldPublication.Schemas.Project{}),
    do: FieldPublication.Schemas.Project

  defp get_module(%FieldPublication.Schemas.Publication{}),
    do: FieldPublication.Schemas.Publication
end

defmodule FieldPublication.Schemas do
  import Ecto.Changeset

  def validate_doc_type(changeset, expected) do
    changeset
    |> Ecto.Changeset.fetch_field(:doc_type)
    |> case do
      {:data, ^expected} ->
        changeset

      {:data, type} ->
        changeset
        |> add_error(
          :doc_type,
          "expected 'doc_type' with value '#{expected}', got '#{type}'"
        )

      :error ->
        changeset
        |> add_error(
          :doc_type,
          "expected 'doc_type' with value '#{expected}'"
        )
    end
  end

  def add_duplicate_doc_error(changeset) do
    add_error(changeset, :duplicate_document, "Document already exists.")
  end

  def construct_doc_id(document, module) do
    ([:doc_type] ++ module.__schema__(:primary_key))
    |> Enum.map(fn key ->
      Map.get(document, key)
    end)
    |> Enum.join("_")
  end
end
