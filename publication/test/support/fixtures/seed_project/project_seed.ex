defmodule FieldPublication.Test.ProjectSeed do
  alias FieldPublication.{
    FileService,
    CouchService,
    Replication,
    Replication.ReplicationInput,
    Processing,
    Project,
    Publication
  }

  require Logger

  @default_draft_date Date.from_iso8601!("2024-06-05")

  def create_full_publication(project_identifier) do
    case Project.get(project_identifier) do
      {:ok, %Project{} = project} ->
        Logger.info("Recreating project '#{project_identifier}'.")
        {:ok, :deleted} = Project.delete(project)

      _ ->
        Logger.info("Creating project '#{project_identifier}'.")
    end

    {:ok, project} =
      Project.put(%Project{}, %{
        "identifier" => project_identifier
      })

    {:ok, %Publication{} = publication} =
      Publication.create_from_replication_input(%ReplicationInput{
        delete_existing_publication: true,
        source_url: "http://example.org",
        source_project_identifier: project_identifier,
        source_user: "remote_field_field_hub_user",
        source_password: "fake",
        project_identifier: project_identifier,
        drafted_by: Application.get_env(:field_publication, :couchdb_admin_name),
        draft_date: @default_draft_date
      })

    {:ok, %Publication{} = publication} =
      Publication.put(publication, %{
        "publication_date" => publication.draft_date,
        "publication_description" => [
          %{
            "text" =>
              "This is a publication created by Field Publication's seed.exs. _The images were reduced in size and do not match the database values!_",
            "language" => "en"
          },
          %{
            "text" =>
              "Dies ist eine Publikation, die durch Field Publications seed.exs erstellt wurde. _Die Bilder wurden verkleinert und ihre Dimensionen stimmen nicht mehr mit der Datenbank überein!_",
            "language" => "de"
          }
        ],
        "languages" => ["en", "de"],
        "replication_finished" => DateTime.utc_now()
      })

    seed_data(publication)

    {project, publication}
  end

  def seed_data(%Publication{project_identifier: project_identifier} = publication) do
    seed_image_directory = "test/support/fixtures/seed_project/images/"

    [] =
      seed_image_directory
      |> File.ls!()
      |> Enum.map(fn uuid ->
        FileService.write_raw_data(
          project_identifier,
          uuid,
          File.read!("#{seed_image_directory}/#{uuid}"),
          :image
        )
      end)
      |> Enum.reject(fn val -> val == :ok end)

    File.read!("test/support/fixtures/seed_project/publication_data.json")
    |> Jason.decode!()
    |> then(fn %{"rows" => rows} ->
      Enum.map(rows, fn %{"doc" => doc} ->
        Map.delete(doc, "_rev")
      end)
    end)
    |> Task.async_stream(fn doc ->
      CouchService.put_document(doc["_id"], doc, publication.database)
    end)
    |> Enum.to_list()

    :ok = Replication.reconstruct_project_configuraton(publication)

    {:ok, publication} = Replication.finalize_metadata(publication)

    {:ok, publication} = Publication.Geo.read_and_set_epsg_code(publication)
    {:ok, publication} = Publication.Geo.read_and_set_coordinate(publication)
    Publication.Geo.generate_feature_collections!(publication)

    [{:ok, %Finch.Response{status: 201}}] =
      Publication.DocumentPreview.recreate_previews(publication)

    %{field_labels: _, category_labels: _} = Publication.Search.index_documents!(publication)

    {:ok, _} = Publication.Search.set_project_alias(publication)

    [] =
      Processing.MapTiles.start(publication)
      |> Enum.reject(fn {val, val} -> val == :ok end)

    [] =
      Processing.WebImage.start(publication)
      |> Enum.reject(fn {val, val} -> val == :ok end)
  end
end
