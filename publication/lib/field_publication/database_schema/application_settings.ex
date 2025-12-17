defmodule FieldPublication.DatabaseSchema.ApplicationSettings do
  defmodule ColorScheme do
    use Ecto.Schema

    import Ecto.Changeset

    @primary_default "#5882c2"
    @primary_inverse_default "#ffffff"
    @primary_hover_default "#375d97"
    @primary_inverse_hover_default "#ffffff"

    @derive Jason.Encoder
    @primary_key false
    embedded_schema do
      field(:primary, :string, default: @primary_default)
      field(:primary_hover, :string, default: @primary_hover_default)
      field(:primary_inverse, :string, default: @primary_inverse_default)
      field(:primary_inverse_hover, :string, default: @primary_inverse_hover_default)
    end

    def changeset(scheme, attrs \\ %{}) do
      scheme
      |> cast(attrs, [
        :primary,
        :primary_hover,
        :primary_inverse,
        :primary_inverse_hover
      ])
      |> force_color_defaults()
    end

    defp force_color_defaults(changeset) do
      changeset
      |> maybe_put_default(:primary, @primary_default)
      |> maybe_put_default(:primary_inverse, @primary_inverse_default)
      |> maybe_put_default(:primary_hover, @primary_hover_default)
      |> maybe_put_default(:primary_inverse_hover, @primary_inverse_hover_default)
    end

    defp maybe_put_default(changeset, key, default_value) do
      put_change(changeset, key, get_field(changeset, key) || default_value)
    end
  end

  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.DatabaseSchema.{
    Base,
    Translation
  }

  @doc_type "application_settings"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:logo, :string)
    field(:favicon, :string)
    field(:page_name, :string, default: "FieldPublication")
    embeds_one(:color_scheme, ColorScheme, defaults_to_struct: true, on_replace: :update)
    embeds_many(:contact, Translation, on_replace: :delete)
  end

  def changeset(settings, attrs \\ %{}) do
    settings
    |> cast(attrs, [
      :_rev,
      :logo,
      :favicon,
      :page_name
    ])
    |> cast_embed(:color_scheme)
    |> cast_embed(:contact,
      sort_param: :contact_sort,
      drop_param: :contact_drop
    )
    |> ensure_no_language_duplicate()
    |> Base.validate_doc_type(@doc_type)
  end

  defp ensure_no_language_duplicate(changeset) do
    contact = get_field(changeset, :contact)

    invalid =
      Enum.map(contact, fn %Translation{language: language} -> language end)
      |> Enum.frequencies()
      |> Enum.any?(fn {_key, count} -> count > 1 end)

    if invalid do
      add_error(changeset, :contact, "only one imprint per language allowed")
    else
      changeset
    end
  end
end
