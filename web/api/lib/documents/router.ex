defmodule Api.Documents.Router do
  use Plug.Router
  alias Api.Documents.Index
  alias Api.Documents.Predecessors
  alias Api.Documents.DescendantsImages
  import Api.RouterUtils
  import Api.Core.Layout

  plug :match
  plug Api.Auth.ReadableProjectsPlug
  plug :dispatch

  match "/" do
    send_json(conn, Index.search(
      conn.params["q"] || "*",
      conn.params["size"] || 100,
      conn.params["from"] || 0,
      conn.params["filters"],
      conn.params["not"],
      conn.params["exists"],
      conn.params["not_exists"],
      conn.params["sort"],
      conn.params["vector_query"],
      conn.private[:readable_projects]
    ))
  end

  match "/map" do
    send_json(conn, Index.search_geometries(
      conn.params["q"] || "*",
      conn.params["filters"],
      conn.params["not"],
      conn.params["exists"],
      conn.params["not_exists"],
      conn.private[:readable_projects]
    ))
  end

  get "/:id" do
    with doc = %{ project: project, resource: resource } <- Index.get(id),
         %{ resource: project_resource } <- Index.get(project),
         :ok <- access_for_project_allowed(conn.private[:readable_projects], project),
         config <- Api.Core.ProjectConfigLoader.get(project),
         layouted_doc <- put_in(doc.resource, to_layouted_resource(config, resource, project_resource))
    do
      send_json(conn, layouted_doc)
    else
      nil -> send_not_found(conn)
      :unauthorized_access -> send_unauthorized(conn)
      _ -> IO.puts "other error"
    end
  end

  get "/predecessors/:id" do
    with doc = %{ project: project } <- Index.get(id),
         :ok <- access_for_project_allowed(conn.private[:readable_projects], project)
    do
      send_json(conn, %{ results: Predecessors.get(doc) })
    else
      nil -> send_not_found(conn)
      :unauthorized_access -> send_unauthorized(conn)
      _ -> IO.puts "other error"
    end
  end

  get "/descendantsImages/:id/:numberOfImages" do
    with doc = %{ project: project } <- Index.get(id),
         :ok <- access_for_project_allowed(conn.private[:readable_projects], project)
    do
      send_json(conn, %{ results: DescendantsImages.get(
        doc, elem(Integer.parse(numberOfImages), 0), conn.private[:readable_projects]
      )})
    else
      nil -> send_not_found(conn)
      :unauthorized_access -> send_unauthorized(conn)
      _ -> IO.puts "other error"
    end
  end

  match "/similar/:model/:id" do
    doc = Index.get(id)
    vector_query = %{
      "model" => model,
      "query_vector" => get_in(doc, [:resource, :relations ,:isDepictedIn, Access.at(0) ,:resource, :featureVectors, model])
    }
    send_json(conn, Index.search(
      conn.params["q"] || "*",
      conn.params["size"] || 10,
      conn.params["from"] || 0,
      conn.params["filters"],
      conn.params["not"] || ["resource.id:#{id}"],
      conn.params["exists"],
      conn.params["not_exists"],
      conn.params["sort"],
      vector_query,
      conn.private[:readable_projects]
    ))
  end
end
