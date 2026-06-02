defmodule FieldPublication.DatabaseSchema.Base do
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
