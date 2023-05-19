defmodule Api.Project do
  alias Api.Services.{
    CouchService
  }

  alias Api.Publication

  require Logger

  @translation_db_suffix "_translations"
  @styles_db_suffix "_styles"

  @date_pattern ~r/^(?<db>.*)-(?<version>\d{4}-\d{2}-\d{2})$/

  def index() do
    CouchService.get_all_databases()
    |> Stream.filter(fn name ->
      cond do
        String.ends_with?(name, @translation_db_suffix) ->
          false

        String.ends_with?(name, @styles_db_suffix) ->
          false

        true ->
          true
      end
    end)
    |> Stream.map(fn name ->
      Regex.named_captures(@date_pattern, name)
    end)
    |> Enum.reduce(%{}, fn %{"db" => database_name, "version" => version}, acc ->
      Map.update(acc, database_name, %{versions: [version]}, fn versions ->
        versions ++ [version]
      end)
    end)
  end

  def create(project_name) do
    create(project_name, [])
  end

  def create(project_name, members) do
    project_name
    |> CouchService.create_database()
    |> case do
      {:ok, %{status_code: 201}} ->
        {:ok, %{status_code: 200}} = CouchService.add_application_user(project_name)

        project_name
        |> CouchService.store_document("users", %{members: members})
    end
  end

  def add_member(project_name, user_name) do
    project_name
    |> get_project_document("users")
    |> case do
      {:ok, users} ->
        updated =
          Map.update!(users, "members", fn(existing_members) ->
            Enum.uniq(existing_members ++ [user_name])
          end)

        CouchService.store_document(project_name, "users", updated)
    end
  end

  def remove_member(project_name, user_name) do
    project_name
    |> get_project_document("users")
    |> case do
      {:ok, users} ->
        updated =
          Map.update!(users, "members", fn(existing_members) ->
            List.delete(existing_members, user_name)
          end)

        CouchService.store_document(project_name, "users", updated)
    end
  end

  def initialize_publication(project_name, source_url, source_project_name, source_user, source_password) do
    Publication.replicate(source_url, source_project_name, source_user, source_password, project_name)
    |> case do
      %{
        name: publication_name
      } = replication_result ->
        project_name
        |> get_project_document("publications")
        |> case do
          {:ok, publications} ->
            CouchService.store_document(
              project_name,
              "publications",
              Map.put(publications, publication_name, replication_result)
            )
        end
    end
  end

  defp get_project_document(project_name, doc_id) do
    CouchService.retrieve_document(project_name, doc_id)
    |> case do
      {:ok, %{body: body, status_code: 200}} ->
        body
        |> Jason.decode()
      {:ok, %{status_code: 404}} ->
        {:error, :unknown_project}
      end
  end
end
