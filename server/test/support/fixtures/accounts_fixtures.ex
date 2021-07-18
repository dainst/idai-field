defmodule IdaiFieldServer.AccountsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `IdaiFieldServer.Accounts` context.
  """

  def unique_project_email, do: "project#{System.unique_integer()}@example.com"
  def valid_project_password, do: "hello world!"

  def project_fixture(attrs \\ %{}) do
    {:ok, project} =
      attrs
      |> Enum.into(%{
        email: unique_project_email(),
        password: valid_project_password()
      })
      |> IdaiFieldServer.Accounts.register_project()

    project
  end

  def extract_project_token(fun) do
    {:ok, captured} = fun.(&"[TOKEN]#{&1}[TOKEN]")
    [_, token, _] = String.split(captured.body, "[TOKEN]")
    token
  end
end
