defmodule Api.Core.ProjectConfigLoader do
  require Logger
  use Agent

  def start_link({project_config_dir_name, projects}) do
    
    projects = (projects || Api.Core.Config.get(:projects)) ++ ["default"]
    
    configs = for project <- projects, into: %{} do
      {
        project,
        load(project_config_dir_name, project)
      }
    end
    Agent.start_link(fn -> configs end, name: __MODULE__)
  end
  def start_link(_), do: start_link({nil, nil})

  def get(project_name), do: Agent.get(__MODULE__, fn configs ->
    if configs[project_name] != nil do
      configs[project_name]
    else
      configs["default"]
    end
  end)

  defp load(config_dir, project_name) do
    file_name = config_dir <> "/" <> project_name <> ".json"
    #Logger.info "Loading #{config_dir}"
    Logger.info "Loading project configuration from  #{file_name}"
    with {:ok, body} <- File.read(file_name),
         {:ok, json} <- Poison.decode(body)
    do
      Api.Core.Utils.atomize(json, [:values])
    else
      _ ->
        Logger.info "No configuration found for project #{project_name}, using default configuration"
        nil
    end
  end
end
