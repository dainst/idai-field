defmodule Api.Core.ProjectConfigLoader do
  alias Api.Core.Config
  require Logger
  use Agent

  def start_link({projects}) do
    projects = (projects || Api.Core.Config.get(:projects) ++ ["default"])
    
    configs = for project <- projects, into: %{} do
      {
        project,
        load(project)
      }
    end
    Agent.start_link(fn -> configs end, name: __MODULE__)
  end
  def start_link(_), do: start_link({nil, nil})

  def update(project) do
    Agent.update(__MODULE__, fn configs -> Map.put(configs, project, load(project)) end, 600000)
  end

  def get(project_name), do: Agent.get(__MODULE__, fn configs -> configs[project_name] end, 600000).categories
  
  def get_languages(project_name), do: Agent.get(__MODULE__, fn configs -> configs[project_name] end, 600000).projectLanguages

  defp load(project_name) do
    if Mix.env() != :test do create_config_file project_name end
    project_config_dir_name = if Mix.env() == :test do "test/resources" else "resources/projects" end
    file_name = project_config_dir_name <> "/" <> project_name <> ".json"
    
    Logger.info "Loading project configuration from #{file_name}"
    with {:ok, body} <- File.read(file_name),
         {:ok, json} <- Poison.decode(body)
    do
      Api.Core.Utils.atomize(json, [:values])
    else
      _ ->
        Logger.warn "No configuration found for project #{project_name}."
        nil
    end
  end

  defp create_config_file(project_name) do
    IO.inspect System.cmd(
      "node",
      [
        "assets/js/createConfigurationFile.js",
        project_name,
        Config.get(:couchdb_url),
        Config.get(:couchdb_user),
        Config.get(:couchdb_password)
      ]
    )
  end
end
