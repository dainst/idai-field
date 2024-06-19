defmodule Seeder do
  alias FieldPublication.OpensearchService
  alias FieldPublication.Processing
  alias FieldPublication.FileService
  alias FieldPublication.Replication
  alias FieldPublication.CouchService
  alias FieldPublication.Publications
  alias FieldPublication.DocumentSchema.ReplicationInput
  alias FieldPublication.Projects

  require Logger

  def start() do
    seed_project_docs =
      File.read!("test/support/fixtures/seed_project/publication_data.json")
      |> Jason.decode!()
      |> then(fn %{"rows" => rows} ->
        Enum.map(rows, fn %{"doc" => doc} ->
          Map.delete(doc, "_rev")
        end)
      end)

    seed_project_identifier =
      Enum.find(seed_project_docs, fn %{"_id" => uuid} = _doc ->
        uuid == "project"
      end)
      |> then(fn %{"resource" => %{"identifier" => identifier}} -> identifier end)

    case Projects.get(seed_project_identifier) do
      {:ok, %FieldPublication.DocumentSchema.Project{} = project} ->
        Logger.info("Recreating seed project '#{seed_project_identifier}'.")
        {:ok, :deleted} = Projects.delete(project)

        Seeder.create(seed_project_identifier, seed_project_docs)

      _ ->
        Logger.info("Creating seed project '#{seed_project_identifier}'.")
        Seeder.create(seed_project_identifier, seed_project_docs)
    end
  end

  def create(identifier, docs) do
    {:ok, %FieldPublication.DocumentSchema.Project{}} =
      Projects.put(%FieldPublication.DocumentSchema.Project{}, %{
        "name" => identifier
      })

    {:ok, replication_input} =
      ReplicationInput.create(%{
        "source_url" => "http://example.org",
        "source_project_name" => identifier,
        "source_user" => "local_developer",
        "source_password" => "fake",
        "project_name" => identifier,
        "drafted_by" => "mix seed"
      })

    {:ok, %FieldPublication.DocumentSchema.Publication{} = publication} =
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

    :ok = Processing.OpenSearch.index(publication)

    {:ok, _} = OpensearchService.set_project_alias(publication) |> IO.inspect()

    {:ok, %FieldPublication.DocumentSchema.Publication{} = publication} =
      Publications.put(publication, %{
        "publication_date" => Date.utc_today(),
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

    [] =
      Processing.MapTiles.start_tile_creation(publication)
      |> Enum.reject(fn val -> val == :ok end)

    [] =
      Processing.Image.start_web_image_processing(publication)
      |> Enum.reject(fn val -> val == :ok end)
  end
end

Seeder.start()
