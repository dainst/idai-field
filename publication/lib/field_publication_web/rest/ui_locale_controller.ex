defmodule FieldPublicationWeb.UILanguageController do
  use FieldPublicationWeb, :controller

  def selection(conn, %{"locale" => locale, "return_to" => return_to} = _params) do
    conn
    |> FieldPublicationWeb.Gettext.Plug.set_locale(locale)
    |> redirect(to: return_to)
  end
end
