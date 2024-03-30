defmodule FieldPublicationWeb.Gettext do
  @moduledoc """
  A module providing Internationalization with a gettext-based API.

  By using [Gettext](https://hexdocs.pm/gettext),
  your module gains a set of macros for translations, for example:

      import FieldPublicationWeb.Gettext

      # Simple translation
      gettext("Here is the string to translate")

      # Plural translation
      ngettext("Here is the string to translate",
               "Here are the strings to translate",
               3)

      # Domain-based translation
      dgettext("errors", "Here is the error message to translate")

  See the [Gettext Docs](https://hexdocs.pm/gettext) for detailed usage.
  """
  use Gettext,
    otp_app: :field_publication,
    default_locale: "en"

  def on_mount(
        :default,
        _params,
        %{"locale" => locale} = _session,
        socket
      ) do
    Gettext.put_locale(FieldPublicationWeb.Gettext, locale)

    # Put the current path into the assigns of any live view in the application. This is required for the
    # `return_to` parameter in the UI switch form (see app.html.heex).
    socket =
      Phoenix.LiveView.attach_hook(
        socket,
        :put_path_in_assigns,
        :handle_params,
        fn _params, url, socket ->
          {:cont, Phoenix.Component.assign(socket, :current_path, URI.parse(url).path)}
        end
      )

    {:cont, socket}
  end

  def get_locale_labels(),
    do: %{
      "de" => "Deutsch",
      "en" => "English",
      "el" => "Έλληνικά",
      "es" => "Español",
      "fr" => "Français",
      "it" => "Italiano",
      "pt" => "Português",
      "tr" => "Türkçe",
      "uk" => "Українська"
    }
end

defmodule FieldPublicationWeb.Gettext.Plug do
  use FieldPublicationWeb, :verified_routes

  import Plug.Conn

  def fetch_locale(conn, _opts) do
    case get_session(conn, :locale) do
      nil ->
        locale =
          conn
          |> get_req_header("accept-language")
          |> select_best_match_accept_language_header()

        set_locale(conn, locale)

      locale ->
        Gettext.put_locale(FieldPublicationWeb.Gettext, locale)
        conn
    end
  end

  def set_locale(conn, locale) do
    Gettext.put_locale(FieldPublicationWeb.Gettext, locale)
    put_session(conn, :locale, locale)
  end

  defp select_best_match_accept_language_header([]) do
    "en"
  end

  defp select_best_match_accept_language_header([value]) do
    value
    |> String.split(",")
    |> Enum.map(fn lang_with_weight ->
      lang_with_weight
      |> String.split(";")
      |> Enum.map(&String.trim/1)
      |> case do
        [lang] ->
          {1, lang}

        [lang, q] ->
          [_q, weight_string] = String.split(q, "=")
          {weight, _remainder_of_binary} = Float.parse(weight_string)

          {weight, lang}
      end
    end)
    |> Enum.filter(fn {_weight, lang} ->
      lang in Gettext.known_locales(FieldPublicationWeb.Gettext)
    end)
    |> Enum.sort()
    |> List.last()
    |> then(fn {_weight, language} -> language end)
  end
end
