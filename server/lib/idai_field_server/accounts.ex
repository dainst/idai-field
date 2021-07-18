defmodule IdaiFieldServer.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias IdaiFieldServer.Repo
  alias IdaiFieldServer.Accounts.{Project, ProjectToken, ProjectNotifier}

  ## Database getters

  @doc """
  Gets a project by email.

  ## Examples

      iex> get_project_by_email("foo@example.com")
      %Project{}

      iex> get_project_by_email("unknown@example.com")
      nil

  """
  def get_project_by_email(email) when is_binary(email) do
    Repo.get_by(Project, email: email)
  end

  @doc """
  Gets a project by email and password.

  ## Examples

      iex> get_project_by_email_and_password("foo@example.com", "correct_password")
      %Project{}

      iex> get_project_by_email_and_password("foo@example.com", "invalid_password")
      nil

  """
  def get_project_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do

    project = Repo.get_by(Project, email: email)
    if Project.valid_password?(project, password), do: project
  end

  @doc """
  Gets a single project.

  Raises `Ecto.NoResultsError` if the Project does not exist.

  ## Examples

      iex> get_project!(123)
      %Project{}

      iex> get_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_project!(id), do: Repo.get!(Project, id)

  ## Project registration

  @doc """
  Registers a project.

  ## Examples

      iex> register_project(%{field: value})
      {:ok, %Project{}}

      iex> register_project(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def register_project(attrs) do
    %Project{}
    |> Project.registration_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking project changes.

  ## Examples

      iex> change_project_registration(project)
      %Ecto.Changeset{data: %Project{}}

  """
  def change_project_registration(%Project{} = project, attrs \\ %{}) do
    Project.registration_changeset(project, attrs)
  end

  ## Settings

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the project e-mail.

  ## Examples

      iex> change_project_email(project)
      %Ecto.Changeset{data: %Project{}}

  """
  def change_project_email(project, attrs \\ %{}) do
    Project.email_changeset(project, attrs)
  end

  @doc """
  Emulates that the e-mail will change without actually changing
  it in the database.

  ## Examples

      iex> apply_project_email(project, "valid password", %{email: ...})
      {:ok, %Project{}}

      iex> apply_project_email(project, "invalid password", %{email: ...})
      {:error, %Ecto.Changeset{}}

  """
  def apply_project_email(project, password, attrs) do
    project
    |> Project.email_changeset(attrs)
    |> Project.validate_current_password(password)
    |> Ecto.Changeset.apply_action(:update)
  end

  @doc """
  Updates the project e-mail in token.

  If the token matches, the project email is updated and the token is deleted.
  The confirmed_at date is also updated to the current time.
  """
  def update_project_email(project, token) do
    context = "change:#{project.email}"

    with {:ok, query} <- ProjectToken.verify_change_email_token_query(token, context),
         %ProjectToken{sent_to: email} <- Repo.one(query),
         {:ok, _} <- Repo.transaction(project_email_multi(project, email, context)) do
      :ok
    else
      _ -> :error
    end
  end

  defp project_email_multi(project, email, context) do
    changeset = project |> Project.email_changeset(%{email: email}) |> Project.confirm_changeset()

    Ecto.Multi.new()
    |> Ecto.Multi.update(:project, changeset)
    |> Ecto.Multi.delete_all(:tokens, ProjectToken.project_and_contexts_query(project, [context]))
  end

  @doc """
  Delivers the update e-mail instructions to the given project.

  ## Examples

      iex> deliver_update_email_instructions(project, current_email, &Routes.project_update_email_url(conn, :edit, &1))
      {:ok, %{to: ..., body: ...}}

  """
  def deliver_update_email_instructions(%Project{} = project, current_email, update_email_url_fun)
      when is_function(update_email_url_fun, 1) do
    {encoded_token, project_token} = ProjectToken.build_email_token(project, "change:#{current_email}")

    Repo.insert!(project_token)
    ProjectNotifier.deliver_update_email_instructions(project, update_email_url_fun.(encoded_token))
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the project password.

  ## Examples

      iex> change_project_password(project)
      %Ecto.Changeset{data: %Project{}}

  """
  def change_project_password(project, attrs \\ %{}) do
    Project.password_changeset(project, attrs)
  end

  @doc """
  Updates the project password.

  ## Examples

      iex> update_project_password(project, "valid password", %{password: ...})
      {:ok, %Project{}}

      iex> update_project_password(project, "invalid password", %{password: ...})
      {:error, %Ecto.Changeset{}}

  """
  def update_project_password(project, password, attrs) do
    changeset =
      project
      |> Project.password_changeset(attrs)
      |> Project.validate_current_password(password)

    Ecto.Multi.new()
    |> Ecto.Multi.update(:project, changeset)
    |> Ecto.Multi.delete_all(:tokens, ProjectToken.project_and_contexts_query(project, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{project: project}} -> {:ok, project}
      {:error, :project, changeset, _} -> {:error, changeset}
    end
  end

  ## Session

  @doc """
  Generates a session token.
  """
  def generate_project_session_token(project) do
    {token, project_token} = ProjectToken.build_session_token(project)
    Repo.insert!(project_token)
    token
  end

  @doc """
  Gets the project with the given signed token.
  """
  def get_project_by_session_token(token) do
    {:ok, query} = ProjectToken.verify_session_token_query(token)
    Repo.one(query)
  end

  @doc """
  Deletes the signed token with the given context.
  """
  def delete_session_token(token) do
    Repo.delete_all(ProjectToken.token_and_context_query(token, "session"))
    :ok
  end

  ## Confirmation

  @doc """
  Delivers the confirmation e-mail instructions to the given project.

  ## Examples

      iex> deliver_project_confirmation_instructions(project, &Routes.project_confirmation_url(conn, :confirm, &1))
      {:ok, %{to: ..., body: ...}}

      iex> deliver_project_confirmation_instructions(confirmed_project, &Routes.project_confirmation_url(conn, :confirm, &1))
      {:error, :already_confirmed}

  """
  def deliver_project_confirmation_instructions(%Project{} = project, confirmation_url_fun)
      when is_function(confirmation_url_fun, 1) do
    if project.confirmed_at do
      {:error, :already_confirmed}
    else
      {encoded_token, project_token} = ProjectToken.build_email_token(project, "confirm")
      Repo.insert!(project_token)
      ProjectNotifier.deliver_confirmation_instructions(project, confirmation_url_fun.(encoded_token))
    end
  end

  @doc """
  Confirms a project by the given token.

  If the token matches, the project account is marked as confirmed
  and the token is deleted.
  """
  def confirm_project(token) do
    with {:ok, query} <- ProjectToken.verify_email_token_query(token, "confirm"),
         %Project{} = project <- Repo.one(query),
         {:ok, %{project: project}} <- Repo.transaction(confirm_project_multi(project)) do
      {:ok, project}
    else
      _ -> :error
    end
  end

  defp confirm_project_multi(project) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:project, Project.confirm_changeset(project))
    |> Ecto.Multi.delete_all(:tokens, ProjectToken.project_and_contexts_query(project, ["confirm"]))
  end

  ## Reset password

  @doc """
  Delivers the reset password e-mail to the given project.

  ## Examples

      iex> deliver_project_reset_password_instructions(project, &Routes.project_reset_password_url(conn, :edit, &1))
      {:ok, %{to: ..., body: ...}}

  """
  def deliver_project_reset_password_instructions(%Project{} = project, reset_password_url_fun)
      when is_function(reset_password_url_fun, 1) do
    {encoded_token, project_token} = ProjectToken.build_email_token(project, "reset_password")
    Repo.insert!(project_token)
    ProjectNotifier.deliver_reset_password_instructions(project, reset_password_url_fun.(encoded_token))
  end

  @doc """
  Gets the project by reset password token.

  ## Examples

      iex> get_project_by_reset_password_token("validtoken")
      %Project{}

      iex> get_project_by_reset_password_token("invalidtoken")
      nil

  """
  def get_project_by_reset_password_token(token) do
    with {:ok, query} <- ProjectToken.verify_email_token_query(token, "reset_password"),
         %Project{} = project <- Repo.one(query) do
      project
    else
      _ -> nil
    end
  end

  @doc """
  Resets the project password.

  ## Examples

      iex> reset_project_password(project, %{password: "new long password", password_confirmation: "new long password"})
      {:ok, %Project{}}

      iex> reset_project_password(project, %{password: "valid", password_confirmation: "not the same"})
      {:error, %Ecto.Changeset{}}

  """
  def reset_project_password(project, attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:project, Project.password_changeset(project, attrs))
    |> Ecto.Multi.delete_all(:tokens, ProjectToken.project_and_contexts_query(project, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{project: project}} -> {:ok, project}
      {:error, :project, changeset, _} -> {:error, changeset}
    end
  end
end
