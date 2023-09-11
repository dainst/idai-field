defmodule FieldPublication.Replication.MetadataGeneration do
  alias FieldPublication.{
    CouchService,
    Schema.Publication,
    Schema.Project,
    Replication.Parameters
  }

  def create_publication(%Parameters{
        source_url: source_url,
        source_project_name: source_project_name,
        project_key: project_key,
        comments: comments
      }) do
    draft_date = Date.utc_today() |> Date.to_string()

    %Publication{
      source_url: source_url,
      source_project_name: source_project_name,
      configuration_doc: "configuration_#{project_key}_#{draft_date}",
      database: "publication_#{project_key}_#{draft_date}",
      draft_date: draft_date,
      comments: comments
    }
  end

  def reconstruct_project_konfiguraton(%Publication{
        database: database_name,
        configuration_doc: configuration_doc_name
      }) do
    full_config =
      System.cmd(
        "node",
        [
          Application.app_dir(
            :field_publication,
            "priv/publication_enricher/dist/createFullConfiguration.js"
          ),
          database_name,
          Application.get_env(:field_publication, :couchdb_url),
          Application.get_env(:field_publication, :couchdb_admin_name),
          Application.get_env(:field_publication, :couchdb_admin_password)
        ]
      )
      |> then(fn {full_configuration, 0} ->
        Jason.decode!(full_configuration)
      end)

    CouchService.get_document(configuration_doc_name)
    |> case do
      {:ok, %{status: 404}} ->
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})

      {:ok, %{status: 200, body: body}} ->
        %{"_rev" => rev} = Jason.decode!(body)
        CouchService.delete_document(configuration_doc_name, rev)
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})
    end

    {:ok, :configuration_reconstructed}
  end
end
