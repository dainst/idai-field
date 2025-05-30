defmodule FieldPublication.Test.ProjectSeed do
  alias FieldPublication.{
    Projects,
    FileService,
    CouchService,
    Replication,
    Processing,
    Publications
  }

  alias FieldPublication.DatabaseSchema.{
    Project,
    ReplicationInput,
    Publication
  }

  require Logger

  def start(project_name, process_images \\ true) do
    seed_project_docs =
      File.read!("test/support/fixtures/seed_project/publication_data.json")
      |> Jason.decode!()
      |> then(fn %{"rows" => rows} ->
        Enum.map(rows, fn %{"doc" => doc} ->
          Map.delete(doc, "_rev")
        end)
      end)

    case Projects.get(project_name) do
      {:ok, %FieldPublication.DatabaseSchema.Project{} = project} ->
        Logger.info("Recreating project '#{project_name}'.")
        {:ok, :deleted} = Projects.delete(project)

        create(project_name, seed_project_docs, process_images)

      _ ->
        Logger.info("Creating project '#{project_name}'.")
        create(project_name, seed_project_docs, process_images)
    end
  end

  def create(identifier, docs, process_images) do
    {:ok, %Project{} = project} =
      Projects.put(%Project{}, %{
        "name" => identifier
      })

    {:ok, replication_input} =
      ReplicationInput.create(%{
        "source_url" => "http://example.org",
        "source_project_name" => identifier,
        "source_user" => "local_developer",
        "source_password" => "fake",
        "project_name" => identifier,
        "drafted_by" => "mix seed",
        "draft_date" => Date.from_iso8601!("2024-06-05")
      })

    {:ok, %Publication{} = publication} =
      Publications.create_from_replication_input(replication_input)

    Task.async_stream(docs, fn doc ->
      CouchService.put_document(doc["_id"], doc, publication.database)
    end)
    |> Enum.to_list()

    {:ok, %Finch.Response{status: 201}} =
      Replication.create_hierarchy_doc(publication)

    {:ok, %Finch.Response{status: 201}} =
      Replication.reconstruct_project_configuraton(publication)

    seed_image_directory = "test/support/fixtures/seed_project/images/"

    project_languages =
      docs
      |> Enum.find(fn doc ->
        doc["_id"] == "configuration"
      end)
      |> then(fn %{"resource" => %{"projectLanguages" => langs}} -> langs end)

    [] =
      seed_image_directory
      |> File.ls!()
      |> Enum.map(fn uuid ->
        FileService.write_raw_data(
          identifier,
          uuid,
          File.read!("#{seed_image_directory}/#{uuid}"),
          :image
        )
      end)
      |> Enum.reject(fn val -> val == :ok end)

    %{field_labels: _, category_labels: _} = Publications.Search.index_documents(publication)

    {:ok, _} = Publications.Search.set_project_alias(publication)

    {:ok, %FieldPublication.DatabaseSchema.Publication{} = publication} =
      Publications.put(publication, %{
        "publication_date" => Date.from_iso8601!("2024-06-05"),
        "comments" => [
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
        "languages" => project_languages,
        "replication_finished" => DateTime.utc_now()
      })

    if process_images do
      [] =
        Processing.MapTiles.start(publication)
        |> Enum.reject(fn val -> val == :ok end)

      [] =
        Processing.WebImage.start(publication)
        |> Enum.reject(fn val -> val == :ok end)
    end

    {project, publication}
  end
end
