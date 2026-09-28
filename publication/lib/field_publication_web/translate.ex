defmodule FieldPublicationWeb.Translate do
  @moduledoc """
  A module providing Internationalization with a gettext-based API.

  By using [Gettext](https://hexdocs.pm/gettext),
  your module gains a set of macros for translations, for example:

      use Gettext, backend: FieldPublicationWeb.Translate

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
  use Gettext.Backend,
    otp_app: :field_publication,
    default_locale: "en"

  def on_mount(
        :default,
        _params,
        %{"locale" => locale} = _session,
        socket
      ) do
    Gettext.put_locale(FieldPublicationWeb.Translate, locale)

    # Put the current path into the assigns of any live view in the application. This is required for the
    # `return_to` parameter in the UI language switch form (see app.html.heex).
    socket =
      Phoenix.LiveView.attach_hook(
        socket,
        :put_path_in_assigns,
        :handle_params,
        fn _params, url, socket ->
          %URI{path: path, query: query} = URI.parse(url)

          {:cont, Phoenix.Component.assign(socket, :current_path, "#{path}?#{query}")}
        end
      )

    {:cont, socket}
  end

  def get_locale_labels() do
    %{
      "de" => "Deutsch",
      "en" => "English",
      # "el" => "Έλληνικά",
      "es" => "Español",
      # "fr" => "Français",
      "it" => "Italiano",
      "pt" => "Português",
      "tr" => "Türkçe",
      "uk" => "Українська"
    }
  end

  def supported_languages() do
    Gettext.known_locales(FieldPublicationWeb.Translate)
  end

  def pick_default_translation(options) when is_map(options) do
    key = pick_default_language_key(options)

    Map.get(options, key)
  end

  def pick_default_translation(value) when is_binary(value) do
    value
  end

  def pick_default_language_key(options) when is_map(options) do
    pick_default_language_key(Map.keys(options))
  end

  def pick_default_language_key(options) when is_list(options) do
    user_ui_language = Gettext.get_locale(FieldPublicationWeb.Translate)

    cond do
      user_ui_language in options ->
        user_ui_language

      "en" in options ->
        "en"

      true ->
        List.first(options)
    end
  end

  @doc ~S"""
  A helper for translations with links.

  Copied from https://gist.github.com/angelikatyborska/cebc3de03c08307edebf6054ed09ff5f.

  Pass in the translation string which must include  `%{link_start}`/`%{link_end}`. For multiple URLs, use `%{link_start_<0,1,2...>}`.

  Pass in either a single `url_string` or tuple `{url_string,  html_attributes_string}`, or a list thereof, under the key `:link` or
  `:links`, in the same order as the link start markers (i.e. the first item in the list will be injected as `link_start_0` etc.) in the translation string.

  ## Usage examples:

  ### Single links:

      iex> gettext_with_link("This will be %{link_start}linked to Google%{link_end}", link: [href: "https://google.com", target: "_blank"])
      {:safe, ~s|This will be <a href="https://google.com" target="_blank">linked to Google</a>|}

  ### Multiple links:

      iex> gettext_with_link("This will be %{link_start_1}linked to Google (new tab)%{link_end_1} and %{link_start_2}this to Yahoo%{link_end_2}",
      ...>                link: [[href: "https://google.com", target: "_blank", class: "foobar"], [href: "https://yahoo.com"]]
      ...>             )
      {:safe, ~s|This will be <a href="https://google.com" class="foobar" target="_blank">linked to Google (new tab)</a> and <a href="https://yahoo.com" >this to Yahoo</a>|}

  ### Links mixed with other variables:

      iex> gettext_with_link("Read more of %{link_start}%{post_title}%{link_end}", post_title: "Hello World!", link: [href: "https://example.com/myblog/post1", target: "_blank"])
      {:safe, ~s|Read more of <a href="https://example.com/myblog/post1" target="_blank">Hello World!</a>|}

  ### Liveview:

      iex> gettext_with_link("This will be %{link_start}LV Navigate Link%{link_end}", link: [navigate: "/navigate"])
      {:safe, ~s|This will be <a href="/navigate" data-phx-link="redirect" data-phx-link-state="push" >LV Navigate Link</a>|}

      iex> gettext_with_link("This will be %{link_start}LV Navigate Link%{link_end}", link: [navigate: "/navigate", replace: true])
      {:safe, ~s|This will be <a href="/navigate" data-phx-link="redirect" data-phx-link-state="replace" >LV Navigate Link</a>|}

      iex> gettext_with_link("This will be %{link_start}LV Patch Link%{link_end}", link: [patch: "/patch"])
      {:safe, ~s|This will be <a href="/patch" data-phx-link="patch" data-phx-link-state="push" >LV Patch Link</a>|}

      iex> gettext_with_link("This will be %{link_start}LV Patch Link%{link_end}", link: [patch: "/patch", replace: true])
      {:safe, ~s|This will be <a href="/patch" data-phx-link="patch" data-phx-link-state="replace" >LV Patch Link</a>|}

  """
  defmacro gettext_with_link(msgid, opts) do
    quote do
      dgettext_with_link("default", unquote(msgid), unquote(opts))
    end
  end

  @doc """
  Same as gettext_with_link/2 but allows for choosing a domain.
  """
  defmacro dgettext_with_link(domain, msgid, opts) do
    quote do
      dpgettext_with_link(unquote(domain), nil, unquote(msgid), unquote(opts))
    end
  end

  @doc """
  Same as gettext_with_link/2 but allows for choosing a context.
  """
  defmacro pgettext_with_link(msgctxt, msgid, opts) do
    quote do
      dpgettext_with_link("default", unquote(msgctxt), unquote(msgid), unquote(opts))
    end
  end

  @doc """
  Same as gettext_with_link/2 but allows for choosing a domain and context.
  """
  defmacro dpgettext_with_link(domain, msgctxt, msgid, bindings) do
    key = :link

    new_bindings =
      case Keyword.get(bindings, key) do
        nil ->
          []

        [list | _] = nested_list when is_list(list) ->
          nested_list
          |> Enum.with_index(1)
          |> Enum.reduce([], fn {opts, index}, acc ->
            Keyword.merge(acc, new_bindings(key, opts, index))
          end)

        opts when is_list(opts) ->
          new_bindings(key, opts)
      end

    quote do
      bindings =
        unquote(bindings)
        |> Keyword.delete(unquote(key))
        |> Keyword.merge(unquote(new_bindings))

      Phoenix.HTML.raw(dpgettext(unquote(domain), unquote(msgctxt), unquote(msgid), bindings))
    end
  end

  # Tags _______________________________________________________________________________________________________________

  defp start_tag(opts) do
    attrs = attributes(opts)

    cond do
      url = Keyword.get(opts, :navigate) ->
        replace = Keyword.get(opts, :replace)

        quote do
          ~s(<a href="#{unquote(url)}" data-phx-link="redirect" data-phx-link-state="#{if unquote(replace), do: "replace", else: "push"}" #{unquote(attrs)}>)
        end

      url = Keyword.get(opts, :patch) ->
        replace = Keyword.get(opts, :replace)

        quote do
          ~s(<a href="#{unquote(url)}" data-phx-link="patch" data-phx-link-state="#{if unquote(replace), do: "replace", else: "push"}" #{unquote(attrs)}>)
        end

      url = Keyword.get(opts, :href) ->
        quote do
          ~s(<a href="#{unquote(url)}" #{unquote(attrs)}>)
        end

      true ->
        raise ArgumentError,
              "Missing option, add either `:navigate`, `:patch` or `:href` to `#{inspect(opts)}`"
    end
  end

  defp end_tag(_), do: "</a>"

  # Helper _____________________________________________________________________________________________________________

  defp new_bindings(key, opts, index \\ nil) when is_list(opts),
    do: [{start_key(key, index), start_tag(opts)}, {end_key(key, index), end_tag(opts)}]

  # credo:disable-for-next-line
  defp start_key(key, nil), do: :"#{key}_start"
  # credo:disable-for-next-line
  defp start_key(key, i) when is_integer(i), do: :"#{key}_start_#{i}"
  # credo:disable-for-next-line
  defp end_key(key, nil), do: :"#{key}_end"
  # credo:disable-for-next-line
  defp end_key(key, i) when is_integer(i), do: :"#{key}_end_#{i}"

  defp attributes(opts) when is_list(opts) do
    opts
    |> Keyword.take(
      ~w(aria-label aria-hidden class download hreflang id referrerpolicy rel target type)a
    )
    |> Enum.reduce([], fn {key, value}, acc ->
      string =
        case key do
          :download ->
            if value, do: "download", else: nil

          _ ->
            ~s(#{key}="#{value}")
        end

      if string, do: [string] ++ acc, else: acc
    end)
    |> Enum.join(" ")
  end
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
        Gettext.put_locale(FieldPublicationWeb.Translate, locale)
        conn
    end
  end

  def set_locale(conn, locale) do
    Gettext.put_locale(FieldPublicationWeb.Translate, locale)
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
      lang in Gettext.known_locales(FieldPublicationWeb.Translate)
    end)
    |> Enum.sort()
    |> List.last()
    |> then(fn {_weight, language} -> language end)
  end
end
