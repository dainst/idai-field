defmodule IdaiFieldServer.AccountsTest do
  use IdaiFieldServer.DataCase

  alias IdaiFieldServer.Accounts
  import IdaiFieldServer.AccountsFixtures
  alias IdaiFieldServer.Accounts.{Project, ProjectToken}

  describe "get_project_by_email/1" do
    test "does not return the project if the email does not exist" do
      refute Accounts.get_project_by_email("unknown@example.com")
    end

    test "returns the project if the email exists" do
      %{id: id} = project = project_fixture()
      assert %Project{id: ^id} = Accounts.get_project_by_email(project.email)
    end
  end

  describe "get_project_by_email_and_password/1" do
    test "does not return the project if the email does not exist" do
      refute Accounts.get_project_by_email_and_password("unknown@example.com", "hello world!")
    end

    test "does not return the project if the password is not valid" do
      project = project_fixture()
      refute Accounts.get_project_by_email_and_password(project.email, "invalid")
    end

    test "returns the project if the email and password are valid" do
      %{id: id} = project = project_fixture()

      assert %Project{id: ^id} =
               Accounts.get_project_by_email_and_password(project.email, valid_project_password())
    end
  end

  describe "get_project!/1" do
    test "raises if id is invalid" do
      assert_raise Ecto.NoResultsError, fn ->
        Accounts.get_project!(-1)
      end
    end

    test "returns the project with the given id" do
      %{id: id} = project = project_fixture()
      assert %Project{id: ^id} = Accounts.get_project!(project.id)
    end
  end

  describe "register_project/1" do
    test "requires email and password to be set" do
      {:error, changeset} = Accounts.register_project(%{})

      assert %{
               password: ["can't be blank"],
               email: ["can't be blank"]
             } = errors_on(changeset)
    end

    test "validates email and password when given" do
      {:error, changeset} = Accounts.register_project(%{email: "not valid", password: "not valid"})

      assert %{
               email: ["must have the @ sign and no spaces"],
               password: ["should be at least 12 character(s)"]
             } = errors_on(changeset)
    end

    test "validates maximum values for e-mail and password for security" do
      too_long = String.duplicate("db", 100)
      {:error, changeset} = Accounts.register_project(%{email: too_long, password: too_long})
      assert "should be at most 160 character(s)" in errors_on(changeset).email
      assert "should be at most 80 character(s)" in errors_on(changeset).password
    end

    test "validates e-mail uniqueness" do
      %{email: email} = project_fixture()
      {:error, changeset} = Accounts.register_project(%{email: email})
      assert "has already been taken" in errors_on(changeset).email

      # Now try with the upper cased e-mail too, to check that email case is ignored.
      {:error, changeset} = Accounts.register_project(%{email: String.upcase(email)})
      assert "has already been taken" in errors_on(changeset).email
    end

    test "registers projects with a hashed password" do
      email = unique_project_email()
      {:ok, project} = Accounts.register_project(%{email: email, password: valid_project_password()})
      assert project.email == email
      assert is_binary(project.hashed_password)
      assert is_nil(project.confirmed_at)
      assert is_nil(project.password)
    end
  end

  describe "change_project_registration/2" do
    test "returns a changeset" do
      assert %Ecto.Changeset{} = changeset = Accounts.change_project_registration(%Project{})
      assert changeset.required == [:password, :email]
    end
  end

  describe "change_project_email/2" do
    test "returns a project changeset" do
      assert %Ecto.Changeset{} = changeset = Accounts.change_project_email(%Project{})
      assert changeset.required == [:email]
    end
  end

  describe "apply_project_email/3" do
    setup do
      %{project: project_fixture()}
    end

    test "requires email to change", %{project: project} do
      {:error, changeset} = Accounts.apply_project_email(project, valid_project_password(), %{})
      assert %{email: ["did not change"]} = errors_on(changeset)
    end

    test "validates email", %{project: project} do
      {:error, changeset} =
        Accounts.apply_project_email(project, valid_project_password(), %{email: "not valid"})

      assert %{email: ["must have the @ sign and no spaces"]} = errors_on(changeset)
    end

    test "validates maximum value for e-mail for security", %{project: project} do
      too_long = String.duplicate("db", 100)

      {:error, changeset} =
        Accounts.apply_project_email(project, valid_project_password(), %{email: too_long})

      assert "should be at most 160 character(s)" in errors_on(changeset).email
    end

    test "validates e-mail uniqueness", %{project: project} do
      %{email: email} = project_fixture()

      {:error, changeset} =
        Accounts.apply_project_email(project, valid_project_password(), %{email: email})

      assert "has already been taken" in errors_on(changeset).email
    end

    test "validates current password", %{project: project} do
      {:error, changeset} =
        Accounts.apply_project_email(project, "invalid", %{email: unique_project_email()})

      assert %{current_password: ["is not valid"]} = errors_on(changeset)
    end

    test "applies the e-mail without persisting it", %{project: project} do
      email = unique_project_email()
      {:ok, project} = Accounts.apply_project_email(project, valid_project_password(), %{email: email})
      assert project.email == email
      assert Accounts.get_project!(project.id).email != email
    end
  end

  describe "deliver_update_email_instructions/3" do
    setup do
      %{project: project_fixture()}
    end

    test "sends token through notification", %{project: project} do
      token =
        extract_project_token(fn url ->
          Accounts.deliver_update_email_instructions(project, "current@example.com", url)
        end)

      {:ok, token} = Base.url_decode64(token, padding: false)
      assert project_token = Repo.get_by(ProjectToken, token: :crypto.hash(:sha256, token))
      assert project_token.project_id == project.id
      assert project_token.sent_to == project.email
      assert project_token.context == "change:current@example.com"
    end
  end

  describe "update_project_email/2" do
    setup do
      project = project_fixture()
      email = unique_project_email()

      token =
        extract_project_token(fn url ->
          Accounts.deliver_update_email_instructions(%{project | email: email}, project.email, url)
        end)

      %{project: project, token: token, email: email}
    end

    test "updates the e-mail with a valid token", %{project: project, token: token, email: email} do
      assert Accounts.update_project_email(project, token) == :ok
      changed_project = Repo.get!(Project, project.id)
      assert changed_project.email != project.email
      assert changed_project.email == email
      assert changed_project.confirmed_at
      assert changed_project.confirmed_at != project.confirmed_at
      refute Repo.get_by(ProjectToken, project_id: project.id)
    end

    test "does not update e-mail with invalid token", %{project: project} do
      assert Accounts.update_project_email(project, "oops") == :error
      assert Repo.get!(Project, project.id).email == project.email
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end

    test "does not update e-mail if project e-mail changed", %{project: project, token: token} do
      assert Accounts.update_project_email(%{project | email: "current@example.com"}, token) == :error
      assert Repo.get!(Project, project.id).email == project.email
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end

    test "does not update e-mail if token expired", %{project: project, token: token} do
      {1, nil} = Repo.update_all(ProjectToken, set: [inserted_at: ~N[2020-01-01 00:00:00]])
      assert Accounts.update_project_email(project, token) == :error
      assert Repo.get!(Project, project.id).email == project.email
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end
  end

  describe "change_project_password/2" do
    test "returns a project changeset" do
      assert %Ecto.Changeset{} = changeset = Accounts.change_project_password(%Project{})
      assert changeset.required == [:password]
    end
  end

  describe "update_project_password/3" do
    setup do
      %{project: project_fixture()}
    end

    test "validates password", %{project: project} do
      {:error, changeset} =
        Accounts.update_project_password(project, valid_project_password(), %{
          password: "not valid",
          password_confirmation: "another"
        })

      assert %{
               password: ["should be at least 12 character(s)"],
               password_confirmation: ["does not match password"]
             } = errors_on(changeset)
    end

    test "validates maximum values for password for security", %{project: project} do
      too_long = String.duplicate("db", 100)

      {:error, changeset} =
        Accounts.update_project_password(project, valid_project_password(), %{password: too_long})

      assert "should be at most 80 character(s)" in errors_on(changeset).password
    end

    test "validates current password", %{project: project} do
      {:error, changeset} =
        Accounts.update_project_password(project, "invalid", %{password: valid_project_password()})

      assert %{current_password: ["is not valid"]} = errors_on(changeset)
    end

    test "updates the password", %{project: project} do
      {:ok, project} =
        Accounts.update_project_password(project, valid_project_password(), %{
          password: "new valid password"
        })

      assert is_nil(project.password)
      assert Accounts.get_project_by_email_and_password(project.email, "new valid password")
    end

    test "deletes all tokens for the given project", %{project: project} do
      _ = Accounts.generate_project_session_token(project)

      {:ok, _} =
        Accounts.update_project_password(project, valid_project_password(), %{
          password: "new valid password"
        })

      refute Repo.get_by(ProjectToken, project_id: project.id)
    end
  end

  describe "generate_project_session_token/1" do
    setup do
      %{project: project_fixture()}
    end

    test "generates a token", %{project: project} do
      token = Accounts.generate_project_session_token(project)
      assert project_token = Repo.get_by(ProjectToken, token: token)
      assert project_token.context == "session"

      # Creating the same token for another project should fail
      assert_raise Ecto.ConstraintError, fn ->
        Repo.insert!(%ProjectToken{
          token: project_token.token,
          project_id: project_fixture().id,
          context: "session"
        })
      end
    end
  end

  describe "get_project_by_session_token/1" do
    setup do
      project = project_fixture()
      token = Accounts.generate_project_session_token(project)
      %{project: project, token: token}
    end

    test "returns project by token", %{project: project, token: token} do
      assert session_project = Accounts.get_project_by_session_token(token)
      assert session_project.id == project.id
    end

    test "does not return project for invalid token" do
      refute Accounts.get_project_by_session_token("oops")
    end

    test "does not return project for expired token", %{token: token} do
      {1, nil} = Repo.update_all(ProjectToken, set: [inserted_at: ~N[2020-01-01 00:00:00]])
      refute Accounts.get_project_by_session_token(token)
    end
  end

  describe "delete_session_token/1" do
    test "deletes the token" do
      project = project_fixture()
      token = Accounts.generate_project_session_token(project)
      assert Accounts.delete_session_token(token) == :ok
      refute Accounts.get_project_by_session_token(token)
    end
  end

  describe "deliver_project_confirmation_instructions/2" do
    setup do
      %{project: project_fixture()}
    end

    test "sends token through notification", %{project: project} do
      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_confirmation_instructions(project, url)
        end)

      {:ok, token} = Base.url_decode64(token, padding: false)
      assert project_token = Repo.get_by(ProjectToken, token: :crypto.hash(:sha256, token))
      assert project_token.project_id == project.id
      assert project_token.sent_to == project.email
      assert project_token.context == "confirm"
    end
  end

  describe "confirm_project/2" do
    setup do
      project = project_fixture()

      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_confirmation_instructions(project, url)
        end)

      %{project: project, token: token}
    end

    test "confirms the e-mail with a valid token", %{project: project, token: token} do
      assert {:ok, confirmed_project} = Accounts.confirm_project(token)
      assert confirmed_project.confirmed_at
      assert confirmed_project.confirmed_at != project.confirmed_at
      assert Repo.get!(Project, project.id).confirmed_at
      refute Repo.get_by(ProjectToken, project_id: project.id)
    end

    test "does not confirm with invalid token", %{project: project} do
      assert Accounts.confirm_project("oops") == :error
      refute Repo.get!(Project, project.id).confirmed_at
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end

    test "does not confirm e-mail if token expired", %{project: project, token: token} do
      {1, nil} = Repo.update_all(ProjectToken, set: [inserted_at: ~N[2020-01-01 00:00:00]])
      assert Accounts.confirm_project(token) == :error
      refute Repo.get!(Project, project.id).confirmed_at
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end
  end

  describe "deliver_project_reset_password_instructions/2" do
    setup do
      %{project: project_fixture()}
    end

    test "sends token through notification", %{project: project} do
      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_reset_password_instructions(project, url)
        end)

      {:ok, token} = Base.url_decode64(token, padding: false)
      assert project_token = Repo.get_by(ProjectToken, token: :crypto.hash(:sha256, token))
      assert project_token.project_id == project.id
      assert project_token.sent_to == project.email
      assert project_token.context == "reset_password"
    end
  end

  describe "get_project_by_reset_password_token/2" do
    setup do
      project = project_fixture()

      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_reset_password_instructions(project, url)
        end)

      %{project: project, token: token}
    end

    test "returns the project with valid token", %{project: %{id: id}, token: token} do
      assert %Project{id: ^id} = Accounts.get_project_by_reset_password_token(token)
      assert Repo.get_by(ProjectToken, project_id: id)
    end

    test "does not return the project with invalid token", %{project: project} do
      refute Accounts.get_project_by_reset_password_token("oops")
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end

    test "does not return the project if token expired", %{project: project, token: token} do
      {1, nil} = Repo.update_all(ProjectToken, set: [inserted_at: ~N[2020-01-01 00:00:00]])
      refute Accounts.get_project_by_reset_password_token(token)
      assert Repo.get_by(ProjectToken, project_id: project.id)
    end
  end

  describe "reset_project_password/3" do
    setup do
      %{project: project_fixture()}
    end

    test "validates password", %{project: project} do
      {:error, changeset} =
        Accounts.reset_project_password(project, %{
          password: "not valid",
          password_confirmation: "another"
        })

      assert %{
               password: ["should be at least 12 character(s)"],
               password_confirmation: ["does not match password"]
             } = errors_on(changeset)
    end

    test "validates maximum values for password for security", %{project: project} do
      too_long = String.duplicate("db", 100)
      {:error, changeset} = Accounts.reset_project_password(project, %{password: too_long})
      assert "should be at most 80 character(s)" in errors_on(changeset).password
    end

    test "updates the password", %{project: project} do
      {:ok, updated_project} = Accounts.reset_project_password(project, %{password: "new valid password"})
      assert is_nil(updated_project.password)
      assert Accounts.get_project_by_email_and_password(project.email, "new valid password")
    end

    test "deletes all tokens for the given project", %{project: project} do
      _ = Accounts.generate_project_session_token(project)
      {:ok, _} = Accounts.reset_project_password(project, %{password: "new valid password"})
      refute Repo.get_by(ProjectToken, project_id: project.id)
    end
  end

  describe "inspect/2" do
    test "does not include password" do
      refute inspect(%Project{password: "123456"}) =~ "password: \"123456\""
    end
  end
end
