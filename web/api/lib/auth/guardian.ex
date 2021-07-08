defmodule Api.Auth.Guardian do
  use Guardian, otp_app: :api

  @impl true
  def subject_for_token(user, _claims) do
    content = Poison.encode!(%{
      user_name: user.name,
    })
    {:ok, content}
  end
    
  @impl true
  def resource_from_claims(claims) do
    content = Api.Core.Utils.atomize(Poison.decode!(claims["sub"]))
    {:ok, content}
  end
end
