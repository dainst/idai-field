defmodule FieldPublication.Settings do
  alias FieldPublication.FileService
  alias FieldPublication.CouchService

  use FieldPublicationWeb, :verified_routes

  @setting_doc_name "field_publication_settings"

  @setting_keys [:logo, :favicon]

  def initial_setup() do
    doc =
      CouchService.get_document(@setting_doc_name)
      |> case do
        {:ok, %{status: 404}} ->
          doc = %{logo: nil, favicon: nil}

          {:ok, %{status: 201}} =
            CouchService.put_document(@setting_doc_name, doc)

          doc

        {:ok, %{status: 200, body: body}} ->
          doc = Jason.decode!(body)

          updated = %{
            logo: doc["logo"],
            favicon: doc["favicon"]
          }

          # Write doc back immediately if the setting doc is missing
          # keys required by this version of FieldPublication
          {:ok, %{status: 201}} =
            CouchService.put_document(@setting_doc_name, Map.merge(doc, updated))

          updated
      end

    Cachex.put(:document_cache, @setting_doc_name, doc)
  end

  def update(setting_key, setting_value) when setting_key in @setting_keys do
    CouchService.get_document(@setting_doc_name)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        updated_doc =
          body
          |> Jason.decode!(keys: :atoms!)
          |> Map.put(setting_key, setting_value)

        CouchService.put_document(@setting_doc_name, updated_doc)

        Cachex.put(:document_cache, @setting_doc_name, updated_doc)
    end
  end

  def get_setting(key) when key in @setting_keys do
    Cachex.get!(:document_cache, @setting_doc_name)
    |> Map.get(key)
  end

  def save_logo_file(input_path, file_name) do
    FileService.store_logo(input_path, file_name)
  end

  def delete_logo_file(file_name) do
    %{logo: current_logo, favicon: current_favicon} =
      Cachex.get!(:document_cache, @setting_doc_name)

    if current_logo == file_name do
      update(:logo, nil)
    end

    if current_favicon == file_name do
      update(:favicon, nil)
    end

    FileService.delete_logo(file_name)
  end

  def list_logos() do
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
    Cachex.get!(:document_cache, @setting_doc_name)
    |> case do
      %{logo: nil} ->
        # Not configured, use the default shipped with the application within priv/ directory.
        ~p"/images/logo.svg"

      %{logo: logo_name} ->
        ~p"/uploads/#{logo_name}"
    end
  end

  def get_favicon_url() do
    Cachex.get!(:document_cache, @setting_doc_name)
    |> case do
      %{favicon: nil} ->
        # Not configured, use the default shipped with the application within priv/ directory.
        ~p"/favicon.ico"

      %{favicon: logo_name} ->
        ~p"/uploads/#{logo_name}"
    end
  end
end
