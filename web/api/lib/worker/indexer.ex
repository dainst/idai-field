defmodule Api.Worker.Indexer do
  require Logger
  alias Api.Worker.Mapper
  alias Api.Worker.Adapter.IndexAdapter
  alias Api.Worker.Adapter.IdaiFieldDb
  alias Api.Worker.Enricher.Enricher
  alias Api.Core.ProjectConfigLoader

  @doc """
  For a project (identified by its alias) a new index gets created.
  When reindexing for the project is finished, the alias will change to point to the new index
  while the old index gets removed.
  """
  def reindex(project) do
    {new_index, old_index} = IndexAdapter.create_new_index_and_set_alias project

    ProjectConfigLoader.update project
    perform_reindex ProjectConfigLoader.get(project), project, new_index

    IndexAdapter.add_alias_and_remove_old_index project, new_index, old_index
    {:finished, project}
  end

  def stop_reindex(project) do
    IndexAdapter.remove_stale_index_alias project
  end

  defp perform_reindex configuration, project, index do
    IdaiFieldDb.fetch_changes(project)
    |> Enum.filter(&filter_non_owned_document/1)
    |> Enum.map(&Mapper.rename_type_to_category/1)
    |> Enum.map(Mapper.process(configuration))
    |> Enum.filter(&filter_configuration_document/1)
    |> log_finished("mapping", project)
    |> Enricher.process(project, IdaiFieldDb.get_doc(project), configuration)
    |> log_finished("enriching", project)
    |> Enum.map(IndexAdapter.process(project, index))
    |> log_finished("indexing", project)
  end

  defp log_finished(change, step, project) do
    Logger.info "Finished #{step} #{project}"
    change
  end

  defp filter_non_owned_document(_change = %{ doc: %{ project: _project } }), do: false
  defp filter_non_owned_document(_change), do: true

  defp filter_configuration_document(_change = %{ doc: %{ resource: %{ category: "Configuration" } } }), do: false
  defp filter_configuration_document(_change), do: true
end
