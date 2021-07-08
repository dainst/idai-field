defmodule Api.Statistics.Router do
  use Plug.Router
  import Api.RouterUtils
  alias Api.Statistics.ValuelistsCollector
  alias Api.Statistics.ValuelistsAnalyzer

  plug :match
  plug Api.Auth.AdminRightsPlug # todo review if is_admin is the precondition, or rather readable_projects. if the latter, than we use ReadableProjectsPlug
  plug :dispatch

  get "/valuelists" do
    valuelists = ValuelistsCollector.get_for_all
    result = %{
      valuelists: valuelists,
      overlapping: %{
        total: ValuelistsAnalyzer.find_overlapping_valuelists(valuelists, false),
        used: ValuelistsAnalyzer.find_overlapping_valuelists(valuelists, true),
      },
      statistics: %{
        total: %{
          number_of_valuelists: ValuelistsAnalyzer.get_number_of_valuelists(valuelists, false),
          shared: ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, false),
          number_of_shared: length(ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, false)),
          configured: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, false, false),
          used: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, true, false)
        }, project_valuelists: %{
          number_of_valuelists: ValuelistsAnalyzer.get_number_of_valuelists(valuelists, true),
          shared: ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, true),
          number_of_shared: length(ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, true)),
          configured: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, false, true),
          used: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, true, true)
        }
      }
     }
    send_json(conn, result)
  end

  get "/valuelists/:project_name" do
    valuelists = ValuelistsCollector.get_for_project(project_name)
    result = %{
      valuelists: valuelists,
      overlapping: %{
        total: ValuelistsAnalyzer.find_overlapping_valuelists(valuelists, project_name, false),
        used: ValuelistsAnalyzer.find_overlapping_valuelists(valuelists, project_name, true)
      },
      statistics: %{
        total: %{
          number_of_valuelists: ValuelistsAnalyzer.get_number_of_valuelists(valuelists, false),
          shared: ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, false),
          number_of_shared: length(ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, false)),
          configured: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, project_name, false, false),
          used: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, project_name, true, false),
        }, project_valuelists: %{
          number_of_valuelists: ValuelistsAnalyzer.get_number_of_valuelists(valuelists, true),
          shared: ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, true),
          number_of_shared: length(ValuelistsAnalyzer.get_shared_valuelists_names(valuelists, true)),
          configured: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, project_name, false, true),
          used: ValuelistsAnalyzer.get_number_of_configured_valuelists(valuelists, project_name, true, true)
        }
      }
    }
    send_json(conn, result)
  end
end
