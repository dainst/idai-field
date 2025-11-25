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

  alias FieldPublication.DatabaseSchema.Base

  @doc_type "application_settings"
  @primary_key false

  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:logo, :string)
    field(:favicon, :string)
    field(:page_name, :string, default: "FieldPublication")
    embeds_one(:color_scheme, ColorScheme, defaults_to_struct: true, on_replace: :update)
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
    |> Base.validate_doc_type(@doc_type)
  end
end
