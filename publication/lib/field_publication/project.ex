defmodule FieldPublication.Project do
  alias FieldPublication.CouchService

  alias FieldPublication.Publication

  require Logger

  def index(user_name) do
    project_databases = CouchService.get_project_databases()

    if user_name == Application.get_env(:field_publication, :couchdb_admin_name) do
      project_databases
    else
      project_databases
      |> Enum.filter(fn project_name ->
        check_project_authorization(project_name, user_name) == :grantend
      end)
    end
    |> IO.inspect()
  end

  def create(project_name) do
    create(project_name, [])
  end

  def create(project_name, members) do
    project_name
    |> CouchService.create_database()
    |> case do
      {:ok, %Finch.Response{status: 201}} ->
        {:ok, %Finch.Response{status: 200}} = CouchService.add_application_user(project_name)

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
          Map.update!(users, "members", fn existing_members ->
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
          Map.update!(users, "members", fn existing_members ->
            List.delete(existing_members, user_name)
          end)

        CouchService.store_document(project_name, "users", updated)
    end
  end

  def check_project_authorization(project_name, user_name) do
    project_name
    |> get_project_document("users")
    |> case do
      {:ok, users} ->
        if user_name in users["members"] do
          :granted
        else
          :denied
        end

      _ ->
        :denied
    end
  end

  def initialize_publication(
        project_name,
        source_url,
        source_project_name,
        source_user,
        source_password
      ) do
    Publication.replicate(
      source_url,
      source_project_name,
      source_user,
      source_password,
      project_name
    )
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

          {:error, _} ->
            CouchService.store_document(
              project_name,
              "publications",
              %{publication_name => replication_result}
            )
        end
    end
  end

  def get_publications(project_name) do
    project_name
    |> get_project_document("publications")
    |> case do
      {:ok, data} ->
        {:ok, data}

      {:error, :document_not_found} ->
        {:ok, []}
    end
  end

  defp get_project_document(project_name, doc_id) do
    CouchService.retrieve_document(project_name, doc_id)
    |> case do
      {:ok, %Finch.Response{body: body, status: 200}} ->
        body
        |> Jason.decode()

      {:ok, %Finch.Response{status: 404}} ->
        {:error, :document_not_found}
    end
  end
end
