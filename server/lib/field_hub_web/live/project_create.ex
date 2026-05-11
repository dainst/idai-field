defmodule FieldHubWeb.Live.ProjectCreate do
  alias FieldHubWeb.{
    UserAuth
  }

  alias FieldHub.{
    CouchService,
    User,
    Project
  }

  use FieldHubWeb, :live_view

  require Logger

  @identifier_length Application.compile_env(:field_hub, :max_project_identifier_length)

  def mount(params, %{"user_token" => user_token} = _session, socket) do
    user_name =
      user_token
      |> UserAuth.get_user_by_session_token()

    case User.is_admin?(user_name) do
      true ->
        {
          :ok,
          socket
          |> assign(:current_user, user_name)
          |> setup_action(params)
        }

      _ ->
        push_navigate(socket, to: "/")
    end
  end

  def setup_action(%{assigns: %{live_action: :copy}} = socket, %{"from" => from_project_key}) do
    if Project.exists?(from_project_key) do
      socket
      |> assign(:page_title, "Create #{from_project_key} copy")
      |> assign(:from, from_project_key)
      |> evaluate_inputs("", "")
    else
      push_patch(socket, to: ~p"/ui/projects/create")
    end
  end

  def setup_action(%{assigns: %{live_action: :new}} = socket, _params) do
    socket
    |> assign(:page_title, "Create project")
    |> evaluate_inputs("", "")
  end

  def handle_event("update", %{"identifier" => identifier, "password" => password}, socket) do
    {:noreply, evaluate_inputs(socket, identifier, password)}
  end

  def handle_event(
        "generate_password",
        _values,
        %{assigns: %{project_identifier: identifier}} = socket
      ) do
    {:noreply, evaluate_inputs(socket, identifier, CouchService.create_password())}
  end

  def handle_event(
        "create",
        %{"identifier" => identifier, "password" => password},
        %{assigns: %{current_user: user_name, live_action: action}} = socket
      ) do
    socket =
      if User.is_admin?(user_name) do
        case action do
          :copy ->
            copy_project(socket.assigns.from, identifier, password)

          :new ->
            create_project(identifier, password)
        end
        |> case do
          :ok ->
            socket
            |> put_flash(
              :info,
              "Project created project `#{identifier}` with password `#{password}` successfully."
            )
            |> push_navigate(to: "/ui/projects/show/#{identifier}")

          _error ->
            put_flash(socket, :error, "Project creation with the provided input failed.")
        end
      else
        redirect(socket, to: "/")
      end

    {:noreply, socket}
  end

  defp evaluate_inputs(socket, identifier, password) do
    identifier_issue =
      cond do
        identifier == "" ->
          :identifier_empty

        String.length(identifier) > @identifier_length ->
          :identifier_invalid

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
    Lowercase characters (a-z), Digits (0-9) or any of the characters _, $, (, ), +, -, and /. The maximum length is #{@identifier_length} characters.
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
    with :created <- User.create(identifier, password),
         %{database: :created, file_store: %{original_image: :ok, thumbnail_image: :ok}} <-
           Project.create(identifier),
         :set <- Project.update_user(identifier, identifier, :member) do
      :ok
    else
      error ->
        Logger.error("Project creation failed with: #{error}")
        {:error, error}
    end
  end

  defp copy_project(from, to, password) do
    #   # TODO: Actually copy stuff
    #   with :created <- User.create(identifier, password),
    #        %{database: :created, file_store: %{original_image: :ok, thumbnail_image: :ok}} <-
    #          Project.create(identifier),
    #        :set <- Project.update_user(identifier, identifier, :member) do

    #     :ok
    #   else
    #     error ->
    #       Logger.error("Project creation failed with: #{error}")
    #       {:error, error}
    #   end
  end
end
