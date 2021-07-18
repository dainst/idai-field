defmodule IdaiFieldServerWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use IdaiFieldServerWeb.ConnCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import IdaiFieldServerWeb.ConnCase

      alias IdaiFieldServerWeb.Router.Helpers, as: Routes

      # The default endpoint for testing
      @endpoint IdaiFieldServerWeb.Endpoint
    end
  end

  setup tags do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(IdaiFieldServer.Repo)

    unless tags[:async] do
      Ecto.Adapters.SQL.Sandbox.mode(IdaiFieldServer.Repo, {:shared, self()})
    end

    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  @doc """
  Setup helper that registers and logs in projects.

      setup :register_and_log_in_project

  It stores an updated connection and a registered project in the
  test context.
  """
  def register_and_log_in_project(%{conn: conn}) do
    project = IdaiFieldServer.AccountsFixtures.project_fixture()
    %{conn: log_in_project(conn, project), project: project}
  end

  @doc """
  Logs the given `project` into the `conn`.

  It returns an updated `conn`.
  """
  def log_in_project(conn, project) do
    token = IdaiFieldServer.Accounts.generate_project_session_token(project)

    conn
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Plug.Conn.put_session(:project_token, token)
  end
end
