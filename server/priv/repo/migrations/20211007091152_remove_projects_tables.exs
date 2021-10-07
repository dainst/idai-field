defmodule IdaiFieldServer.Repo.Migrations.RemoveProjectsTables do
  use Ecto.Migration

  def change do
    drop table(:projects_tokens)
    drop table(:projects)
  end
end
