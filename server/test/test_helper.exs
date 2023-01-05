ExUnit.start()

alias FieldHub.CLI

defmodule FieldHub.TestHelper do
  def create_test_db_and_user(project, user_name, user_password) do
    CLI.create_project(project)
    CLI.create_user(user_name, user_password)
    CLI.add_user_as_project_member(user_name, project)
    CLI.add_user_as_project_member(Application.get_env(:field_hub, :couchdb_user_name), project)
  end

  def remove_test_db_and_user(project, user_name) do
    remove_project(project)
    CLI.delete_user(user_name)
  end

  def remove_project(project) do
    CLI.delete_project(project)
  end
end
