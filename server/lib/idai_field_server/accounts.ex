defmodule IdaiFieldServer.Accounts do
  @moduledoc """
  The Accounts context.
  """

  # import Ecto.Query, warn: false
  alias IdaiFieldServer.Accounts.{User, UserToken, UserNotifier}

  ## Database getters

  defp user_email_multi(user, email, context) do
    # changeset = user |> User.email_changeset(%{email: email}) |> User.confirm_changeset()
#
    # Ecto.Multi.new()
    # |> Ecto.Multi.update(:user, changeset)
    # |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, [context]))
  end

  @doc """
  Delivers the update e-mail instructions to the given user.

  ## Examples

      iex> deliver_update_email_instructions(user, current_email, &Routes.user_update_email_url(conn, :edit, &1))
      {:ok, %{to: ..., body: ...}}

  """
  # def deliver_update_email_instructions(%User{} = user, current_email, update_email_url_fun)
      # when is_function(update_email_url_fun, 1) do
    # {encoded_token, user_token} = UserToken.build_email_token(user, "change:#{current_email}")

    # Repo.insert!(user_token)
    # UserNotifier.deliver_update_email_instructions(user, update_email_url_fun.(encoded_token))
  # end

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the user password.

  ## Examples

      iex> change_user_password(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user_password(user, attrs \\ %{}) do
    User.password_changeset(user, attrs)
  end

  @doc """
  Updates the user password.

  ## Examples

      iex> update_user_password(user, "valid password", %{password: ...})
      {:ok, %User{}}

      iex> update_user_password(user, "invalid password", %{password: ...})
      {:error, %Ecto.Changeset{}}

  """
  def update_user_password(user, password, attrs) do
    changeset =
      user
      |> User.password_changeset(attrs)
      |> User.validate_current_password(password)

    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, changeset)
    |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, :all))
    # |> Repo.transaction()
    |> case do
      {:ok, %{user: user}} -> {:ok, user}
      {:error, :user, changeset, _} -> {:error, changeset}
    end
  end

  ## Session

  @doc """
  Gets the user with the given signed token.
  """
  def get_user_by_session_token(token) do
    {:ok, query} = UserToken.verify_session_token_query(token)
    # Repo.one(query)
  end

  @doc """
  Deletes the signed token with the given context.
  """
  # def delete_session_token(token) do
    # Repo.delete_all(UserToken.token_and_context_query(token, "session"))
    # :ok
  # end

  ## Confirmation

  @doc """
  Delivers the confirmation e-mail instructions to the given user.

  ## Examples

      iex> deliver_user_confirmation_instructions(user, &Routes.user_confirmation_url(conn, :confirm, &1))
      {:ok, %{to: ..., body: ...}}

      iex> deliver_user_confirmation_instructions(confirmed_user, &Routes.user_confirmation_url(conn, :confirm, &1))
      {:error, :already_confirmed}

  """
  # def deliver_user_confirmation_instructions(%User{} = user, confirmation_url_fun)
      # when is_function(confirmation_url_fun, 1) do
    # if user.confirmed_at do
      # {:error, :already_confirmed}
    # else
      # {encoded_token, user_token} = UserToken.build_email_token(user, "confirm")
      # Repo.insert!(user_token)
      # UserNotifier.deliver_confirmation_instructions(user, confirmation_url_fun.(encoded_token))
    # end
  # end

  @doc """
  Confirms a user by the given token.

  If the token matches, the user account is marked as confirmed
  and the token is deleted.
  """
  def confirm_user(token) do
    # with {:ok, query} <- UserToken.verify_email_token_query(token, "confirm"),
        #  %User{} = user <- Repo.one(query),
        #  {:ok, %{user: user}} <- Repo.transaction(confirm_user_multi(user)) do
      # {:ok, user}
    # else
      # _ -> :error
    # end
  end

  defp confirm_user_multi(user) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, User.confirm_changeset(user))
    |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, ["confirm"]))
  end

  ## Reset password

  @doc """
  Delivers the reset password e-mail to the given user.

  ## Examples

      iex> deliver_user_reset_password_instructions(user, &Routes.user_reset_password_url(conn, :edit, &1))
      {:ok, %{to: ..., body: ...}}

  """
  # def deliver_user_reset_password_instructions(%User{} = user, reset_password_url_fun)
      # when is_function(reset_password_url_fun, 1) do
    # {encoded_token, user_token} = UserToken.build_email_token(user, "reset_password")
    # Repo.insert!(user_token)
    # UserNotifier.deliver_reset_password_instructions(user, reset_password_url_fun.(encoded_token))
  # end

  @doc """
  Gets the user by reset password token.

  ## Examples

      iex> get_user_by_reset_password_token("validtoken")
      %User{}

      iex> get_user_by_reset_password_token("invalidtoken")
      nil

  """
  def get_user_by_reset_password_token(token) do
    # with {:ok, query} <- UserToken.verify_email_token_query(token, "reset_password"),
        #  %User{} = user <- Repo.one(query) do
      # user
    # else
      # _ -> nil
    # end
  end

  @doc """
  Resets the user password.

  ## Examples

      iex> reset_user_password(user, %{password: "new long password", password_confirmation: "new long password"})
      {:ok, %User{}}

      iex> reset_user_password(user, %{password: "valid", password_confirmation: "not the same"})
      {:error, %Ecto.Changeset{}}

  """
  def reset_user_password(user, attrs) do
    # Ecto.Multi.new()
    # |> Ecto.Multi.update(:user, User.password_changeset(user, attrs))
    # |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, :all))
    # |> Repo.transaction()
    # |> case do
      # {:ok, %{user: user}} -> {:ok, user}
      # {:error, :user, changeset, _} -> {:error, changeset}
    # end
  end
end
