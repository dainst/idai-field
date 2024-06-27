defmodule FieldPublication.OpenSearchService do
  alias FieldPublication.Publications
  alias FieldPublication.DocumentSchema.Project
  alias FieldPublication.DocumentSchema.Publication
  require Logger

  def initialize_publication_indices(%Publication{} = pub) do
    publication_alias = generate_publication_alias(pub)
    index_a = "#{publication_alias}__a__"
    index_b = "#{publication_alias}__b__"

    Logger.info("Initializing indices '#{index_a}' and '#{index_b}'.")

    aliased_project_index = get_aliased_project_index(pub)

    if aliased_project_index in [index_a, index_b] do
      # TODO?
      # - As a fallback search all publications for the project, pick the most current one with an active index

      clear_project_alias(pub)
    end

    [index_a, index_b]
    |> Enum.map(
      &Finch.build(
        :delete,
        "#{base_url()}/#{&1}",
        headers()
      )
    )
    |> Enum.map(&Finch.request(&1, FieldPublication.Finch))

    [
      ok: %{status: 200},
      ok: %{status: 200}
    ] =
      [index_a, index_b]
      |> Enum.map(
        &Finch.build(
          :put,
          "#{base_url()}/#{&1}",
          headers()
        )
      )
      |> Enum.map(&Finch.request(&1, FieldPublication.Finch))

    Logger.info("Setting alias '#{publication_alias}' to #{index_a}")

    {:ok, %Finch.Response{status: 200}} =
      Finch.build(
        :post,
        "#{base_url()}/_aliases",
        headers(),
        Jason.encode!(%{actions: [%{add: %{index: index_a, alias: publication_alias}}]})
      )
      |> Finch.request(FieldPublication.Finch)
  end

  def reset_inactive_index(%Publication{} = pub, mapping) do
    inactive_index =
      pub
      |> get_aliased_publication_index()
      |> get_inactive()

    Logger.debug("Deleting index '#{inactive_index}' and setting mapping.")

    Finch.build(
      :delete,
      "#{base_url()}/#{inactive_index}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)

    Finch.build(
      :put,
      "#{base_url()}/#{inactive_index}",
      headers(),
      Jason.encode!(mapping)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def switch_active_alias(%Publication{} = pub) do
    old_index = get_aliased_publication_index(pub)

    publication_alias = generate_publication_alias(pub)

    next_index =
      if String.ends_with?(old_index, "__a__") do
        "#{publication_alias}__b__"
      else
        "#{publication_alias}__a__"
      end

    payload =
      %{
        actions: [
          %{add: %{index: next_index, alias: publication_alias}},
          %{remove: %{index: old_index, alias: publication_alias}}
        ]
      }

    Logger.info("Setting alias '#{publication_alias}' to '#{next_index}'.")

    {:ok, %{status: 200}} =
      Finch.build(
        :post,
        "#{base_url()}/_aliases",
        headers(),
        Jason.encode!(payload)
      )
      |> Finch.request(FieldPublication.Finch)

    if get_aliased_project_index(pub) == old_index do
      set_project_alias(pub)
    end

    :ok
  end

  def set_project_alias(%Publication{} = pub) do
    old_index = get_aliased_project_index(pub)
    next_index = get_aliased_publication_index(pub)

    project_alias = generate_project_alias(pub)

    actions = [%{add: %{index: next_index, alias: project_alias}}]

    actions =
      if old_index == :none do
        actions
      else
        actions ++ [%{remove: %{index: old_index, alias: project_alias}}]
      end

    Logger.info("Setting alias '#{project_alias}' to '#{next_index}'.")

    {:ok, %{status: 200}} =
      Finch.build(
        :post,
        "#{base_url()}/_aliases",
        headers(),
        Jason.encode!(%{actions: actions})
      )
      |> Finch.request(FieldPublication.Finch)
  end

  def clear_project_alias(pub) do
    project_alias = generate_project_alias(pub)
    index = get_aliased_project_index(pub)

    Logger.info("Removing alias '#{project_alias}'.")

    Finch.build(
      :post,
      "#{base_url()}/_aliases",
      headers(),
      Jason.encode!(%{actions: [%{remove: %{index: index, alias: project_alias}}]})
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def post(docs, %Publication{} = publication, use_inactive \\ true) when is_list(docs) do
    # see https://opensearch.org/docs/latest/api-reference/document-apis/bulk/
    active_index = get_aliased_publication_index(publication)

    index =
      if use_inactive do
        get_inactive(active_index)
      else
        active_index
      end

    payload =
      Enum.map(docs, fn doc ->
        "#{Jason.encode!(%{index: %{_index: index, _id: doc["id"]}})}\n#{Jason.encode!(doc)}\n"
      end)
      |> Enum.join()

    Finch.build(
      :post,
      "#{base_url()}/#{index}/_bulk",
      headers(),
      payload
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def put(doc, %Publication{} = publication, use_inactive \\ true) do
    active_index = get_aliased_publication_index(publication)

    index =
      if use_inactive do
        get_inactive(active_index)
      else
        active_index
      end

    Finch.build(
      :post,
      "#{base_url()}/#{index}/_doc/#{doc["id"]}",
      headers(),
      Jason.encode!(doc)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def get_aliased_publication_index(%Publication{} = pub) do
    {:ok, %{status: 200, body: body}} =
      Finch.build(
        :get,
        "#{base_url()}/_alias/#{generate_publication_alias(pub)}",
        headers()
      )
      |> Finch.request(FieldPublication.Finch)

    Jason.decode!(body)
    |> Map.keys()
    |> List.first()
  end

  def get_aliased_project_index(%Publication{} = pub) do
    Finch.build(
      :get,
      "#{base_url()}/_alias/#{generate_project_alias(pub)}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        Jason.decode!(body)
        |> Map.keys()
        |> List.first()

      {:ok, %{status: 404}} ->
        :none
    end
  end

  def get_aliased_project_index(%Project{} = project) do
    Finch.build(
      :get,
      "#{base_url()}/_alias/#{generate_project_alias(project)}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        Jason.decode!(body)
        |> Map.keys()
        |> List.first()

      {:ok, %{status: 404}} ->
        :none
    end
  end

  def get_aliased_publication(%Project{} = project) do
    Finch.build(
      :get,
      "#{base_url()}/_alias/#{generate_project_alias(project)}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        Jason.decode!(body)
        |> Map.keys()
        |> List.first()
        |> index_name_to_publication()
        |> case do
          {:error, :not_found} ->
            {:error, :publication_not_found}

          success ->
            success
        end

      {:ok, %{status: 404}} ->
        {:error, :alias_not_set}
    end
  end

  def get_doc_count(%Publication{} = pub) do
    index_name = get_aliased_publication_index(pub)

    Finch.build(
      :get,
      "#{base_url()}/#{index_name}/_count",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> then(fn {:ok, %{status: 200, body: body}} ->
      Jason.decode!(body)
      |> Map.get("count", 0)
    end)
  end

  def get_project_mappings() do
    Finch.build(
      :get,
      "#{base_url()}/project_*/_mapping",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def run_search(query) do
    search("project_*", query)
  end

  def run_search(query, %Publication{} = publication) do
    index_name = get_aliased_publication_index(publication)

    search(index_name, query)
  end

  defp headers() do
    pw = Application.get_env(:field_publication, :opensearch_admin_password)

    credentials =
      "admin:#{pw}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end

  defp search(index, query) do
    Finch.build(
      :post,
      "#{base_url()}/#{index}/_search",
      headers(),
      Jason.encode!(query)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  defp base_url() do
    Application.get_env(:field_publication, :opensearch_url)
  end

  defp generate_publication_alias(%Publication{} = publication) do
    encode_invalid_chards("publication_#{publication.project_name}_#{publication.draft_date}")
  end

  defp generate_project_alias(%Publication{} = publication) do
    encode_invalid_chards("project_#{publication.project_name}")
  end

  defp generate_project_alias(%Project{} = project) do
    encode_invalid_chards("project_#{project.name}")
  end

  @invalid_chars [":", "\"", "*", "+", "/", "\\", "|", "?", "#", ">", "<"]
  # See https://opensearch.org/docs/2.14/api-reference/index-apis/create-index/#index-naming-restrictions
  defp encode_invalid_chards(index_name) do
    result = String.downcase(index_name)

    Enum.reduce(@invalid_chars, result, fn char, current ->
      String.replace(current, char, "_")
    end)
  end

  def index_name_to_publication(name) do
    regex = ~r/^publication_(.*)_(\d{4}-\d{2}-\d{2})__[ab]__$/

    [[_full_match, project_name, draft_date_iso_8601]] = Regex.scan(regex, name)

    Publications.get(project_name, draft_date_iso_8601)
  end

  defp get_inactive(active_name) do
    if String.ends_with?(active_name, "__a__") do
      String.replace(active_name, "__a__", "__b__")
    else
      String.replace(active_name, "__b__", "__a__")
    end
  end
end
