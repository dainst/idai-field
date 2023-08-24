defmodule FieldPublication.Worker.Replicator do

  defmodule Parameters do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key false
    embedded_schema do
      field :source_url, :string
      field :source_project_name, :string
      field :source_user, :string
      field :source_password, :string
      field :local_project_name, :string
    end

    @doc false
    def changeset(parameters, attrs \\ %{}) do
      parameters
      |> cast(attrs, [:source_url, :source_project_name, :source_user, :source_password, :local_project_name])
      |> validate_required([:source_url, :source_project_name, :source_user, :source_password, :local_project_name])
    end

    def create(params) do
      changeset(%Parameters{}, params)
      |> apply_action(:create)
    end
  end

  use GenServer

  alias FieldPublication.{
    CouchService,
    FileService
  }

  require Logger

  def init() do
    state = %{}
    Logger.info("Replicator ready")

    {:ok, state}
  end

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  def replicate(%Parameters{
      source_url: source_url,
      source_project_name: source_project_name,
      source_user: source_user,
      source_password: source_password,
      local_project_name: project_name
    }) do

    publication_name = "#{project_name}_publication-#{Date.utc_today()}"

    with {:ok, %Finch.Response{status: status_code}} when status_code == 200 or status_code == 201 <-
           CouchService.replicate(
             "#{source_url}/db/#{source_project_name}",
             source_user,
             source_password,
             publication_name
           ),
         {:ok, file_response} <-
           FileService.replicate(
             "#{source_url}/files/#{source_project_name}",
             source_user,
             source_password,
             publication_name
           ),
         {:ok, _} <- create_publication_metadata(project_name, publication_name) do
      CouchService.add_application_user(publication_name)

      %{
        couch_status: :ok,
        file_response: file_response,
        name: publication_name
      }
    else
      {:ok, %Finch.Response{status: 401} = error} ->
        Logger.error(error)
        {:error, :unauthorized}
      {:ok, %Finch.Response{status: 409} = error} ->
        Logger.error(error)
        {:error, :conflict}
      {:ok, %Finch.Response{status: 500, body: body} = error} ->
        Logger.error(error)

        Jason.decode!(body)
        |> case do
          %{"error" => "nxdomain"} ->
            {:error, :invalid_domain}
        end

      error ->
        Logger.error(error)
        :error
    end
  end

  defp create_publication_metadata(project_name, publication_name) do
    url = Application.get_env(:field_publication, :couchdb_url)

    {:ok, full_config} = create_full_configuration(url, publication_name)

    metadata = %{
      publication_name => %{
        date: DateTime.to_iso8601(DateTime.now!("Etc/UTC")),
        configuration: full_config
      }
    }

    CouchService.retrieve_document(project_name, "publications")
    |> case do
      {:ok, %Finch.Response{status: 404}} ->
        CouchService.store_document(project_name, "publications", metadata)
      {:ok, %Finch.Response{body: body, status: 200}} ->
        updated =
          body
          |> Jason.decode!()
          |> then(fn(existing) ->
            existing
            |> Map.merge(metadata)
          end)

        CouchService.store_document(project_name, "publications", updated)
    end
  end

  defp create_full_configuration(url, publication_name) do
    System.cmd(
      "node",
      [
        Application.app_dir(
          :field_publication,
          "priv/publication_enricher/dist/createFullConfiguration.js"
        ),
        publication_name,
        url,
        Application.get_env(:field_publication, :couchdb_admin_name),
        Application.get_env(:field_publication, :couchdb_admin_password)
      ]
    )
    |> case do
      {full_configuration, 0} ->
        {:ok, Jason.decode!(full_configuration)}
    end
  end

  # defp flatten_full_configuration(%{"item" => item, "trees" => trees}, acc) do
  #   Enum.reduce(trees, acc ++ [item], &flatten_full_configuration/2)
  # end

  # defp parse_category(%{
  #        "color" => color,
  #        "description" => description,
  #        "label" => label,
  #        "name" => name,
  #        "groups" => groups
  #      }) do
  #   %{
  #     name: name,
  #     description: Enum.map(description, &parse_language_map/1),
  #     color: color,
  #     label: Enum.map(label, &parse_language_map/1),
  #     groups: Enum.map(groups, &parse_group/1)
  #   }
  # end

  # defp parse_group(%{"label" => label, "name" => name, "fields" => fields}) do
  #   %{
  #     label: Enum.map(label, &parse_language_map/1),
  #     name: name,
  #     fields: Enum.map(fields, &parse_field/1)
  #   }
  # end

  # defp parse_field(%{"description" => description, "label" => label, "name" => name}) do
  #   %{
  #     label: Enum.map(label, &parse_language_map/1),
  #     name: name,
  #     description: Enum.map(description, &parse_language_map/1)
  #   }
  # end

  # defp parse_language_map({key, value}) do
  #   %{String.to_atom(key) => value}
  # end
end
