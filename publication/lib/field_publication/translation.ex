defmodule FieldPublication.DatabaseSchema.Translation do
  use Ecto.Schema
  import Ecto.Changeset

  @derive Jason.Encoder
  @primary_key false
  embedded_schema do
    field(:text, :string, primary_key: true)
    field(:language, :string, primary_key: true)
  end

  def changeset(translation, attrs \\ %{}) do
    translation
    |> cast(attrs, [:text, :language])
    |> validate_required([:text, :language])
  end

  def language_unique_constraint(changeset, field) when is_atom(field) do
    comments = get_field(changeset, field)

    too_many_entries =
      comments
      |> Stream.map(fn %{language: language} -> language end)
      |> Enum.frequencies()
      |> Stream.filter(fn {_language_key, count} -> count > 1 end)
      |> Enum.map(fn {language_key, _count} -> language_key end)

    Enum.reduce(too_many_entries, changeset, fn language_key, acc ->
      add_error(acc, field, "Only one '#{language_key}' translation is allowed.")
    end)
  end
end
