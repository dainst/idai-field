defmodule Api.User do

  alias Api.Services.CouchService

  @field_users_db Application.compile_env(:api, :field_user_db)

  def authenticate(user_name, user_password) do
    user_name
    |> get_user_document()
    |> case do
      {:ok, %{"password" => hash}} ->
        if Argon2.verify_pass(user_password, hash) do
          :success
        else
          :denied
        end
      _ ->
        :denied
    end
  end

  def create(user_name, user_password) do
    CouchService.store_document(
      @field_users_db,
      user_name,
      %{
        password: Argon2.hash_pwd_salt(user_password)
      }
    )
  end

  def set_password(user_name, new_password) do
    user_name
    |> get_user_document()
    |> case do
      {:ok, document} ->
        CouchService.store_document(
          @field_users_db,
          user_name,
          Map.replace(
            document,
            "password",
            Argon2.hash_pwd_salt(new_password))
        )
    end
  end

  defp get_user_document(user_name) do
    CouchService.retrieve_document(@field_users_db, user_name)
    |> case do
      {:ok, %{body: body, status_code: 200}} ->
        body
        |> Jason.decode()
      {:ok, %{status_code: 404}} ->
        {:error, :unknown_user}
      end
  end
end
