defmodule FieldHubWeb.CreateProjectLive do
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

  def mount(_parmas, %{"user_token" => user_token} = _session, socket) do
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
        %{assigns: %{current_user: user_name}} = socket
      ) do
    socket =
      case User.is_admin?(user_name) do
        true ->
          evaluate_inputs(socket, name, password)

        _ ->
          redirect(socket, to: "/")
      end

    {:noreply, socket}
  end

  def handle_event(
        "create",
        %{"name" => name, "password" => password} = _values,
        %{assigns: %{current_user: user_name}} = socket
      ) do
    socket =
      with true <- User.is_admin?(user_name),
           :created <- User.create(name, password),
           %{database: :created, file_store: %{original_image: :ok, thumbnail_image: :ok}} <-
             Project.create(name),
           :set <- Project.update_user(name, name, :member) do
        socket
        |> put_flash(:error, "Something went wrong.")
        |> push_redirect(to: "/ui/monitoring/#{name}")
      else
        e ->
          Logger.error(e)

          socket
          |> put_flash(:error, "Something went wrong.")
      end

    {:noreply, socket}
  end

  def handle_event("generate_password", _values, %{assigns: %{project_name: name}} = socket) do
    password = CouchService.create_password() |> IO.inspect()

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
end
