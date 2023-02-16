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
        %{"identifier" => identifier, "password" => password} = _values,
        socket
      ) do
    {:noreply, evaluate_inputs(socket, identifier, password)}
  end

  def handle_event("generate_password", _values, %{assigns: %{project_identifier: identifier}} = socket) do
    {:noreply, evaluate_inputs(socket, identifier, CouchService.create_password())}
  end

  def handle_event(
        "create",
        %{"identifier" => identifier, "password" => password} = _values,
        %{assigns: %{current_user: user_name}} = socket
      ) do
    socket =
      case User.is_admin?(user_name) do
        true ->
          create_project(identifier, password)
          |> case do
            :ok ->
              socket
              |> put_flash(
                :info,
                "Project created project `#{identifier}` with password `#{password}` successfully."
              )
              |> push_redirect(to: "/ui/projects/show/#{identifier}")

            {:error, msg} ->
              Logger.error(
                "While creating a project got error `#{msg}`, attempt by user `#{user_name}`."
              )

              socket
              |> put_flash(:error, msg)
          end

        false ->
          redirect(socket, to: "/")
      end

    {:noreply, socket}
  end

  defp evaluate_inputs(socket, identifier, password) do
    identifier_issue =
      cond do
        identifier == "" ->
          :identifier_empty

        not String.match?(identifier, ~r/^[a-z][a-z0-9_$()+\/-]*$/) ->
          :identifier_invalid

        Project.exists?(identifier) ->
          :identifier_taken

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
    |> assign(:project_identifier, identifier)
    |> assign(:project_password, password)
    |> assign(
      :issues,
      Enum.reject(
        [identifier_issue] ++ [password_issue],
        fn val -> val == :ok end
      )
    )
  end

  defp format_issue(:identifier_empty),
    do: """
    Please provide a project identifier.
    """

  defp format_issue(:identifier_invalid),
    do: """
    Please provide a valid project identifier. The identifier must begin with a lower case letter (a-z), followed by any of the following letters:
    Lowercase characters (a-z), Digits (0-9) or any of the characters _, $, (, ), +, -, and /.
    """

  defp format_issue(:identifier_taken),
    do: """
    This project identifier is already taken.
    """

  defp format_issue(:password_empty),
    do: """
    Please provide a password.
    """

  defp create_project(identifier, password) do
    case User.create(identifier, password) do
      :created ->
        Project.create(identifier)

      :already_exists ->
        {:error, "Error creating default user `#{identifier}`, the user already exists."}
    end
    |> case do
      {:error, _} = error ->
        # if user creation failed, just pass on the error
        error

      %{database: :created, file_store: %{original_image: :ok, thumbnail_image: :ok}} ->
        Project.update_user(identifier, identifier, :member)

      %{database: :already_exists} ->
        {:error, "Error creating `#{identifier}`, a database with the identifier already exists."}
    end
    |> case do
      {:error, _} = error ->
        # if user or project creation failed, just pass on the error
        error

      :set ->
        :ok
    end
  end
end
