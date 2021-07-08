defmodule Api.Worker.IndexAdapter do
  require Logger
  alias Api.Core.Config

  defguard is_ok(status_code) when status_code >= 200 and status_code < 300

  defguard is_error(status_code) when status_code >= 400

  @doc """
  Indexes a single document
  """
  def process(project, index), do: fn change -> process(change, project, index) end
  def process(nil, _, _), do: nil
  def process(change = %{deleted: true}, project, index) do
    # TODO: mark documents as deleted instead of removing them from index
    case HTTPoison.delete(get_doc_url(change.id, index)) do
      # Deleted documents possibly never existed in the index, so ignore 404s
      {:ok, %HTTPoison.Response{status_code: 404, body: _}} -> nil
      result -> handle_result(result, change, project)
    end
  end
  def process(change, project, index) do
    HTTPoison.put(
      get_doc_url(change.id, index),
      Poison.encode!(change.doc),
      [{"Content-Type", "application/json"}]
    )
    |> handle_result(change, project)
  end

  @doc """
  Creates a new index with new name for a given project, where the project is given by an index alias.

  Returns a concrete index name for a project, as given by an index alias, which can be written to.
  """
  def create_new_index_and_set_alias(project) do
    alias = "#{Config.get(:elasticsearch_index_prefix)}_#{project}"
    {new_index, old_index} = get_new_index_name(alias)
    add_index(new_index)
    {new_index, old_index}
  end

  def remove_stale_index_alias(project) do
    alias = "#{Config.get(:elasticsearch_index_prefix)}_#{project}"
    {new_index, _old_index} = get_new_index_name(alias) # TODO handle failure
    with {:ok, %HTTPoison.Response{body: body}} <- HTTPoison.delete("#{Config.get(:elasticsearch_url)}/#{new_index}"),
         body <- Poison.decode! body
    do
      case body do 
        %{ "acknowledged" => true } -> IO.puts "done" # TODO return message to caller?
        _ -> nil
      end
    else
      _err -> nil
    end
  end

  def add_alias_and_remove_old_index(project, new_index, old_index) do
    alias = "#{Config.get(:elasticsearch_index_prefix)}_#{project}"

    when_alias_exists(alias, fn -> remove_alias(old_index, alias) end)
    add_alias(new_index, alias)
    if old_index != nil, do: when_index_exists(old_index, fn -> remove_index(old_index) end)
  end

  def update_mapping_template() do
    with {:ok, body} <- File.read("resources/elasticsearch-mapping.json"),
         {:ok, _} <- HTTPoison.put(get_template_url(), body, [{"Content-Type", "application/json"}])
    do
      Logger.info "Successfully updated index mapping template"
    else
      err -> Logger.error "Updating index mapping failed: #{inspect err}"
    end
  end

  defp get_doc_url(id, index), do: "#{Config.get(:elasticsearch_url)}/#{index}/_doc/#{id}"
  
  defp get_template_url() do
    "#{Config.get(:elasticsearch_url)}/"
    <> "_template/"
    <> "#{Config.get(:elasticsearch_index_prefix)}"
  end

  defp handle_result({:ok, %HTTPoison.Response{status_code: status_code, body: body}}, _, _)
    when is_ok(status_code) do

    Poison.decode!(body)
  end

  defp handle_result({:ok, %HTTPoison.Response{status_code: status_code, body: body}}, change, project)
    when is_error(status_code) do

    result = Poison.decode!(body)
    Logger.error "Updating index failed!
      status_code: #{status_code}
      project: #{project}
      id: #{change.id}
      result: #{inspect result}"
    nil
  end

  defp handle_result({:error, %HTTPoison.Error{reason: reason}}, change, project) do

    Logger.error "Updating index failed!
      project: #{project}
      id: #{change.id}
      reason: #{inspect reason}"
    nil
  end

  defp when_index_exists(index, f) do
    with {:ok, %HTTPoison.Response{body: body}} <- HTTPoison.get("#{Config.get(:elasticsearch_url)}/#{index}")
    do
      body = Poison.decode! body
      if Map.has_key?(body, "error"), do: nil, else: f.()
    else
      _err -> nil
    end
  end

  defp when_alias_exists(alias, f) do
    with {:ok, %HTTPoison.Response{body: body}} <- HTTPoison.get("#{Config.get(:elasticsearch_url)}/#{alias}/_alias")
    do
      body = Poison.decode! body
      if Map.has_key?(body, "error"), do: nil, else: f.()
    else
      _err -> nil
    end
  end
  
  defp add_index(index) do
    with {:ok, _} <- HTTPoison.put("#{Config.get(:elasticsearch_url)}/#{index}")
    do
      Logger.info "Successfully created index #{index}"
    else
      err -> Logger.error "Creating index failed: #{inspect err}"
    end
  end

  defp remove_index(index) do
    with {:ok, _} <-HTTPoison.delete("#{Config.get(:elasticsearch_url)}/#{index}")
    do
      Logger.info "Successfully removed index #{index}"
    else
      err -> Logger.error "Creating alias failed: #{inspect err}"
    end
  end

  defp add_alias(index, alias) do
    with {:ok,  %HTTPoison.Response{body: _body}} <- HTTPoison.post("#{Config.get(:elasticsearch_url)}/_aliases", 
      Poison.encode!(%{ actions: %{ 
        add: %{ index: index, alias: alias }
        }}), [{"Content-Type", "application/json"}])
    do
      Logger.info "Successfully created alias #{alias} for index #{index}"
    else
      err -> Logger.error "Creating alias failed: #{inspect err}"
    end
  end

  defp remove_alias(index, alias) do
    with {:ok, _} <- HTTPoison.post("#{Config.get(:elasticsearch_url)}/_aliases", Poison.encode!(%{ actions: %{ 
      remove: %{ index: index, alias: alias }
      }}),
      [{"Content-Type", "application/json"}])
      do
        Logger.info "Successfully removed alias #{alias} from index #{index}"
      else
        err -> Logger.error "Removing alias failed: #{inspect err}"
      end
  end

  defp get_new_index_name(alias) do
    with {:ok, %HTTPoison.Response{body: body}} <- HTTPoison.get("#{Config.get(:elasticsearch_url)}/#{alias}/_alias")
      do
        body = Poison.decode! body
        if Map.has_key?(body, "error")
        do
          {alias <> "__a__", nil}
        else
          if String.ends_with?(List.first(Map.keys(body)), "__a__")
          do
            {alias <> "__b__", alias <> "__a__"}
          else
            {alias <> "__a__", alias <> "__b__"}
          end
        end
      else
        _err -> nil
      end
  end
end
