defimpl Jason.Encoder, for: [
  FieldPublication.Schema.Project
] do
  def encode(%{id: id} = document, opts) do

    document
    |> Map.from_struct()
    |> Map.reject(fn {k, v} -> k == :_rev and is_nil(v) end)
    |> Map.put(:_id, id)
    |> Jason.Encode.map(opts)
  end
end

defmodule FieldPublication.Schema do
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
end
