defmodule Api.User do

  alias Api.Services.CouchService

  @field_users_db Application.compile_env(:api, :field_user_db)

  def authenticate(user_name, user_password) do
    CouchService.retrieve_document(@field_users_db, user_name)
    |> case do
      {:ok, %{body: body, status_code: 200}} ->
        body
        |> Jason.decode!()
        |> case do
          %{"password" => password} ->
            if Plug.Crypto.secure_compare(password, user_password) do
              :success
            else
              :denied
            end
          _ ->
            :denied
        end
      val ->
        :denied
    end
  end

  def create_user(user_name, user_password) do
    CouchService.store_document(
      @field_users_db,
      user_name,
      %{
        password: user_password
      }
    )
  end
end
