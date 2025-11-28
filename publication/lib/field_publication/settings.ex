defmodule FieldPublication.Settings do
  alias FieldPublication.FileService
  alias FieldPublication.CouchService

  use FieldPublicationWeb, :verified_routes

  import Ecto.Changeset

  alias FieldPublication.DatabaseSchema.ApplicationSettings

  @setting_doc_name "field_publication_settings"

  def load() do
    doc =
      CouchService.get_document(@setting_doc_name)
      |> case do
        {:ok, %{status: 404}} ->
          {:ok, doc} =
            %ApplicationSettings{}
            |> ApplicationSettings.changeset()
            |> apply_action(:create)

          {:ok, %{status: 201}} =
            CouchService.put_document(@setting_doc_name, doc)

          doc

        {:ok, %{status: 200, body: body}} ->
          unparsed = Jason.decode!(body)

          {:ok, doc} =
            %ApplicationSettings{}
            |> ApplicationSettings.changeset(unparsed)
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

      {:ok, %ApplicationSettings{} = settings} ->
        {:ok, settings}
    end
    |> then(fn {:ok, settings} -> settings end)
  end

  def update(params) do
    CouchService.get_document(@setting_doc_name)
    |> case do
      {:ok, %{status: 404}} ->
        %ApplicationSettings{}
        |> ApplicationSettings.changeset(params)
        |> apply_action(:create)

      {:ok, %{status: 200, body: body}} ->
        {:ok, existing} =
          %ApplicationSettings{}
          |> ApplicationSettings.changeset(Jason.decode!(body))
          |> apply_action(:create)

        ApplicationSettings.changeset(existing, params)
        |> apply_action(:create)
    end
    |> case do
      {:ok, %ApplicationSettings{} = valid_document} ->
        {CouchService.put_document(@setting_doc_name, valid_document), valid_document}

      changeset_error ->
        changeset_error
    end
    |> case do
      {:error, _} = error ->
        error

      {{:ok, %{status: 201}}, %ApplicationSettings{} = doc} ->
        clear_cache()

        Cachex.get(:application_documents, @setting_doc_name)

        {:ok, doc}
    end
  end

  def save_image(input_path, file_name) do
    FileService.store_admin_image_upload(input_path, file_name)
  end

  def delete_image_file(file_name) do
    %ApplicationSettings{} =
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
      {:ok, %ApplicationSettings{} = updated_settings} ->
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
        ~p"/favicon.ico"

      value ->
        ~p"/custom/images/#{value}"
    end
  end

  def get_customized_css() do
    %ApplicationSettings{
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
      #{if is_nil(primary_inverse), do: "", else: "--primary-color-negative: #{primary_inverse};"}
      #{if is_nil(primary_inverse_hover), do: "", else: "--primary-color-hover-negative: #{primary_inverse_hover};"}
    }
    """
  end

  def get_page_name() do
    %ApplicationSettings{page_name: name} = get()

    name
  end

  defp set_cache(doc), do: Cachex.put(:application_documents, @setting_doc_name, doc)
  defp clear_cache(), do: Cachex.del(:application_documents, @setting_doc_name)
end
