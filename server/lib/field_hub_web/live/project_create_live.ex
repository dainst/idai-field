defmodule FieldHubWeb.ProjectCreateLive do
  alias FieldHubWeb.{
    Router.Helpers,
    UserAuth
  }

  alias FieldHub.{
    CouchService,
    User,
    Project
  }

  use Phoenix.LiveView

  require Logger

  def mount(_params, %{"user_token" => user_token} = _session, socket) do
    user_name =
      user_token
      |> UserAuth.get_user_by_session_token()

    case User.is_admin?(user_name) do
      true ->
        {
          :ok,
          socket
          |> assign(:current_user, user_name)
          |> evaluate_inputs("", "")
        }

      _ ->
        redirect(socket, to: "/")
    end
  end

  def handle_event(
        "update",
        %{"name" => name, "password" => password} = _values,
        socket
      ) do
    {:noreply, evaluate_inputs(socket, name, password)}
  end

  def handle_event("generate_password", _values, %{assigns: %{project_name: name}} = socket) do
    {:noreply, evaluate_inputs(socket, name, CouchService.create_password())}
  end

  def handle_event(
        "create",
        %{"name" => name, "password" => password} = _values,
        %{assigns: %{current_user: user_name}} = socket
      ) do
    socket =
      case User.is_admin?(user_name) do
        true ->
          create_project(name, password)
          |> case do
            :ok ->
              socket
              |> put_flash(
                :info,
                "Project created project '#{name}' with password '#{password}' successfully."
              )
              |> push_redirect(to: "/ui/projects/show/#{name}")

            {:error, msg} ->
              Logger.error(
                "While creating a project got error '#{msg}', attempt by user '#{user_name}'."
              )

              socket
              |> put_flash(:error, msg)
          end

        false ->
          redirect(socket, to: "/")
      end

    {:noreply, socket}
  end

  def handle_event("generate_password", _values, %{assigns: %{project_name: name}} = socket) do
    password = CouchService.create_password()

    {:noreply, evaluate_inputs(socket, name, password)}
  end

  defp evaluate_inputs(socket, name, password) do
    name_issue =
      cond do
        name == "" ->
          :name_empty

        not String.match?(name, ~r/^[a-z][a-z0-9_$()+\/-]*$/) ->
          :name_invalid

        Project.exists?(name) ->
          :name_taken

        true ->
          :ok
      end

    password_issue =
      cond do
        password == "" ->
          :password_empty

        true ->
          :ok
      end

    socket
    |> assign(:project_name, name)
    |> assign(:project_password, password)
    |> assign(
      :issues,
      Enum.reject(
        [name_issue] ++ [password_issue],
        fn val -> val == :ok end
      )
    )
  end

  defp format_issue(:name_empty),
    do: """
    Please provide a project name.
    """

  defp format_issue(:name_invalid),
    do: """
    Please provide a valid project name. The name must begin with a lower case letter (a-z), followed by any of the following letters:
    Lowercase characters (a-z), Digits (0-9) or any of the characters _, $, (, ), +, -, and /.
    """

  defp format_issue(:name_taken),
    do: """
    This project name is already taken.
    """

  defp format_issue(:password_empty),
    do: """
    Please provide a password.
    """

  defp create_project(name, password) do
    case User.create(name, password) do
      :created ->
        Project.create(name)

      :already_exists ->
        {:error, "Error creating default user '#{name}', the user already exists."}
    end
    |> case do
      {:error, _} = error ->
        # if user creation failed, just pass on the error
        error

      %{database: :created, file_store: %{original_image: :ok, thumbnail_image: :ok}} ->
        Project.update_user(name, name, :member)

      e ->
        {:error, "Error creating project '#{name}' database and/or file directories : #{e}."}
    end
    |> case do
      {:error, _} = error ->
        # if user or project creation failed, just pass on the error
        error

      :set ->
        :ok

      e ->
        {:error, "Error setting default user: #{e}."}
    end
  end
end
