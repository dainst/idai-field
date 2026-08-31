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

  def create_full_publication(project_identifier, seed_and_preprocess? \\ false, publish? \\ true) do
    project =
      case Projects.get(project_identifier) do
        {:ok, %FieldPublication.DatabaseSchema.Project{} = project} ->
          Logger.info("Recreating project '#{project_identifier}'.")
          {:ok, :deleted} = Projects.delete(project)

          {:ok, %Project{} = project} = create_project(project_identifier)
          project

        _ ->
          Logger.info("Creating project '#{project_identifier}'.")
          {:ok, %Project{} = project} = create_project(project_identifier)
          project
      end

    publication =
      create_publication(
        %ReplicationInput{
          delete_existing_publication: true,
          source_url: "http://example.org",
          source_project_identifier: project_identifier,
          source_user: "remote_field_field_hub_user",
          source_password: "fake",
          project_identifier: project_identifier,
          drafted_by: "mix seed",
          draft_date: Date.from_iso8601!("2024-06-05")
        },
        seed_and_preprocess?,
        seed_and_preprocess?,
        publish?
      )

    {project, publication}
  end

  def add_unpublished(
        project_identifier,
        draft_date,
        seed_data? \\ false,
        preprocess? \\ false
      ) do
    create_publication(
      %ReplicationInput{
        delete_existing_publication: true,
        source_url: "http://example.org",
        source_project_identifier: project_identifier,
        source_user: "remote_field_field_hub_user",
        source_password: "fake",
        project_identifier: project_identifier,
        drafted_by: "mix seed",
        draft_date: draft_date
      },
      seed_data?,
      preprocess?,
      false
    )
  end

  def create_project(identifier) do
    Projects.put(%Project{}, %{
      "identifier" => identifier
    })
  end

  def create_publication(
        %ReplicationInput{project_identifier: project_identifier} = replication_input,
        seed_data? \\ false,
        preprocess? \\ false,
        publish? \\ true
      ) do
    {:ok, %Publication{} = publication} =
      Publications.create_from_replication_input(replication_input)

    :ok = Replication.reconstruct_project_configuraton(publication)

    seed_image_directory = "test/support/fixtures/seed_project/images/"

    # Load latest document, otherwise the put below will error with a revision conflict.
    # publication =
    #   FieldPublication.Publications.get!(publication.project_identifier, publication.draft_date)

    {:ok, %FieldPublication.DatabaseSchema.Publication{} = publication} =
      Publications.put(publication, %{
        "publication_date" => if(publish?, do: publication.draft_date, else: nil),
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
        "languages" => ["en", "de"],
        "replication_finished" => DateTime.utc_now()
      })

    if seed_data? do
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
    end

    if seed_data? && preprocess? do
      # Expecting one batch created.
      [{:ok, %Finch.Response{status: 201}}] =
        Publications.Data.recreate_meta_database(publication)

      %{field_labels: _, category_labels: _} = Publications.Search.index_documents(publication)

      {:ok, _} = Publications.Search.set_project_alias(publication)

      [] =
        Processing.MapTiles.start(publication)
        |> Enum.reject(fn {val, val} -> val == :ok end)

      [] =
        Processing.WebImage.start(publication)
        |> Enum.reject(fn {val, val} -> val == :ok end)
    end

    publication
  end
end
