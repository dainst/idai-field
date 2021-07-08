defmodule Api.Statistics.ValuelistsAnalyzer do
  alias Api.Core.Config

  def find_overlapping_valuelists(valuelists, used_values_only) do
    Enum.reduce(Config.get(:projects), %{}, fn project_name, result ->
      Map.put(result, project_name, find_overlapping_valuelists(valuelists, project_name, used_values_only))
    end)
  end
  def find_overlapping_valuelists(valuelists, project_name, used_values_only) do
    Enum.reduce(valuelists, %{}, &add_to_overlapping_info(&1, &2, project_name, valuelists, used_values_only))
    |> Enum.into(%{})
  end

  def get_number_of_configured_valuelists(valuelists, used_valuelists_only, non_default_only) do
    Enum.reduce(Config.get(:projects), %{}, fn project_name, result ->
      Map.put(result, project_name, get_number_of_configured_valuelists(
        valuelists, project_name, used_valuelists_only, non_default_only
      ))
    end)
  end
  def get_number_of_configured_valuelists(valuelists, project_name, used_valuelists_only, non_default_only) do
    Enum.filter(valuelists, fn { valuelist_name, valuelist } ->
      Map.has_key?(valuelist.total, project_name)
        && (!used_valuelists_only || valuelist.total[project_name] > 0)
        && (!non_default_only || !String.contains?(valuelist_name, "default"))
    end)
    |> length
  end

  def get_number_of_valuelists(valuelists, non_default_only) do
    Enum.filter(valuelists, fn { valuelist_name, _ } ->
      !non_default_only || !String.contains?(valuelist_name, "default")
    end)
    |> length
  end

  def get_shared_valuelists_names(valuelists, non_default_only) do
    Enum.filter(valuelists, fn { valuelist_name, valuelist } ->
      (!non_default_only || !String.contains?(valuelist_name, "default"))
      && length(Map.keys(valuelist.total)) > 1
    end)
    |> Enum.map(fn { valuelist_name, _ } -> valuelist_name end)
  end

  defp add_to_overlapping_info({ valuelist_name, valuelist }, overlapping_info, project_name, valuelists,
         used_values_only) do
    overlapping = find_overlapping_valuelists(valuelist_name, valuelist, project_name, valuelists, used_values_only)
    if length(overlapping) > 0 do
      Map.put(overlapping_info, valuelist_name, overlapping)
    else
      overlapping_info
    end
  end

  defp find_overlapping_valuelists(valuelist_name, valuelist, project_name, valuelists, used_values_only) do
    values_to_check = get_values_to_check(valuelist, project_name, used_values_only)
    if (length(values_to_check) > 0) do
      Enum.filter(valuelists, fn { name, valuelist } ->
        name != valuelist_name && contains_values(valuelist, values_to_check)
      end)
      |> Enum.map(fn { valuelist_name, _ } -> valuelist_name end)
    else
      []
    end
  end

  defp get_values_to_check(valuelist, project_name, used_values_only) do
    if used_values_only do
      get_used_values(valuelist, project_name)
    else
      if Enum.member?(Map.keys(valuelist.total), project_name), do: Map.keys(valuelist.values), else: []
    end
  end

  defp get_used_values(%{ values: values }, project_name) do
    Enum.filter(values, fn { _, counts } ->
      Map.has_key?(counts, project_name) && counts[project_name] > 0
    end)
    |> Enum.map(fn { value_name, _ } -> value_name end)
  end

  defp contains_values(valuelist, values) do
    length(values -- Map.keys(valuelist.values)) == 0
  end
end
