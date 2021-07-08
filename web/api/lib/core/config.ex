defmodule Api.Core.Config do
  require Logger

  def get key do
    with {:ok, val} <- Application.fetch_env(:api, key) do
      val
    else
      _ -> Logger.error "#{key} not set in config!"
           nil
    end
  end

  def get module, key do
    with {:ok, val} <- Application.fetch_env(:api, module),
         val when val != nil <- get_in(val, [key])
    do
      val
    else
      _ -> Logger.error "#{key} not set in config for module #{module}!"
           nil
    end
  end
end
