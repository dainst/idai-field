defmodule FieldPublication.ApplicationSettings do
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

  alias FieldPublication.DatabaseSchema.Translation

  @doc_type "application_settings"
  @primary_key false
  embedded_schema do
    field(:_id, :string, default: @doc_type)
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:logo, :string)
    field(:favicon, :string)
    field(:contact_email, :string, default: nil)
    field(:page_name, :string, default: "FieldPublication")
    embeds_one(:color_scheme, ColorScheme, defaults_to_struct: true, on_replace: :update)
    embeds_many(:imprint, Translation, on_replace: :delete)
  end

  def changeset(settings, attrs \\ %{}) do
    settings
    |> cast(attrs, [
      :_rev,
      :logo,
      :favicon,
      :page_name,
      :contact_email
    ])
    |> cast_embed(:color_scheme)
    |> cast_embed(:imprint,
      sort_param: :imprint_sort,
      drop_param: :imprint_drop
    )
    |> Translation.language_unique_constraint(:imprint)
  end

  alias FieldPublication.FileService
  alias FieldPublication.CouchService

  use FieldPublicationWeb, :verified_routes

  import Ecto.Changeset

  @setting_doc_name "field_publication_settings"

  def load() do
    doc =
      CouchService.get_document(@setting_doc_name)
      |> case do
        {:ok, %{status: 404}} ->
          {:ok, doc} =
            %__MODULE__{}
            |> __MODULE__.changeset()
            |> apply_action(:create)

          {:ok, %{status: 201}} =
            CouchService.put_document(@setting_doc_name, doc)

          doc

        {:ok, %{status: 200, body: body}} ->
          unparsed = Jason.decode!(body)

          {:ok, doc} =
            %__MODULE__{}
            |> __MODULE__.changeset(unparsed)
            |> apply_action(:create)

          doc
      end

    set_cache(doc)

    {:ok, doc}
  end

  def get() do
    Cachex.get(:application_documents, @setting_doc_name)
    |> case do
      {:ok, nil} ->
        load()

      {:ok, %__MODULE__{} = settings} ->
        {:ok, settings}
    end
    |> then(fn {:ok, settings} -> settings end)
  end

  def update(params) do
    CouchService.get_document(@setting_doc_name)
    |> case do
      {:ok, %{status: 404}} ->
        %__MODULE__{}
        |> __MODULE__.changeset(params)
        |> apply_action(:create)

      {:ok, %{status: 200, body: body}} ->
        {:ok, existing} =
          %__MODULE__{}
          |> __MODULE__.changeset(Jason.decode!(body))
          |> apply_action(:create)

        __MODULE__.changeset(existing, params)
        |> apply_action(:create)
    end
    |> case do
      {:ok, %__MODULE__{} = valid_document} ->
        {CouchService.put_document(@setting_doc_name, valid_document), valid_document}

      changeset_error ->
        changeset_error
    end
    |> case do
      {:error, _} = error ->
        error

      {{:ok, %{status: 201}}, %__MODULE__{} = doc} ->
        clear_cache()

        Cachex.get(:application_documents, @setting_doc_name)

        {:ok, doc}
    end
  end

  def save_image(input_path, file_name) do
    FileService.store_admin_image_upload(input_path, file_name)
  end

  def delete_image_file(file_name) do
    %__MODULE__{} =
      current_setttings =
      Cachex.get!(:application_documents, @setting_doc_name)

    changes = %{}

    changes =
      if current_setttings.logo == file_name do
        Map.put(changes, :logo, nil)
      else
        changes
      end

    changes =
      if current_setttings.favicon == file_name do
        Map.put(changes, :favicon, nil)
      else
        changes
      end

    changes
    |> update()
    |> case do
      {:ok, %__MODULE__{} = updated_settings} ->
        FileService.delete_admin_image_upload(file_name)
        {:ok, updated_settings}

      {:error, _} = error ->
        error
    end
  end

  def list_images() do
    FileService.list_uploaded_logos()
    |> Enum.map(fn {file_name, path} ->
      if String.ends_with?(path, ".svg") do
        {file_name, {:svg, File.read!(path)}}
      else
        {file_name, :img}
      end
    end)
  end

  def get_logo_url() do
    get()
    |> Map.get(:logo)
    |> case do
      nil ->
        ~p"/images/logo.svg"

      value ->
        ~p"/custom/images/#{value}"
    end
  end

  def get_favicon_url() do
    get()
    |> Map.get(:favicon)
    |> case do
      nil ->
        ~p"/images/favicon.ico"

      value ->
        ~p"/custom/images/#{value}"
    end
  end

  def get_customized_css() do
    %__MODULE__{
      color_scheme: %{
        primary: primary,
        primary_hover: primary_hover,
        primary_inverse: primary_inverse,
        primary_inverse_hover: primary_inverse_hover
      }
    } = get()

    """
    :root {
      #{if is_nil(primary), do: "", else: "--primary-color: #{primary};"}
      #{if is_nil(primary_hover), do: "", else: "--primary-color-hover: #{primary_hover};"}
      #{if is_nil(primary_inverse), do: "", else: "--primary-color-inverse: #{primary_inverse};"}
      #{if is_nil(primary_inverse_hover), do: "", else: "--primary-color-hover-inverse: #{primary_inverse_hover};"}
    }
    """
  end

  def get_page_name() do
    %__MODULE__{page_name: name} = get()

    name
  end

  def get_contact_email() do
    %__MODULE__{contact_email: contact_email} = get()

    contact_email
  end

  defp set_cache(doc), do: Cachex.put(:application_documents, @setting_doc_name, doc)
  defp clear_cache(), do: Cachex.del(:application_documents, @setting_doc_name)
end
