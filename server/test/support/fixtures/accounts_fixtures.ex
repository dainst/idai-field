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

  def unique_user_email, do: "user#{System.unique_integer()}@example.com"
  def valid_user_password, do: "hello world!"

  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        email: unique_user_email(),
        password: valid_user_password()
      })
      |> IdaiFieldServer.Accounts.register_user()

    user
  end

  def extract_user_token(fun) do
    {:ok, captured} = fun.(&"[TOKEN]#{&1}[TOKEN]")
    [_, token, _] = String.split(captured.body, "[TOKEN]")
    token
  end
end
