defmodule IdaiFieldServer.Repo.Migrations.CreateProjectsAuthTables do
  use Ecto.Migration

  def change do
    execute "CREATE EXTENSION IF NOT EXISTS citext", ""

    create table(:projects) do
      add :email, :citext, null: false
      add :hashed_password, :string, null: false
      add :confirmed_at, :naive_datetime
      timestamps()
    end

    create unique_index(:projects, [:email])

    create table(:projects_tokens) do
      add :project_id, references(:projects, on_delete: :delete_all), null: false
      add :token, :binary, null: false
      add :context, :string, null: false
      add :sent_to, :string
      timestamps(updated_at: false)
    end

    create index(:projects_tokens, [:project_id])
    create unique_index(:projects_tokens, [:context, :token])
  end
end
