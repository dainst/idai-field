defmodule IdaiFieldServerWeb.CouchDBController do
  use IdaiFieldServerWeb, :controller

  def convert_to_klist(%{} = map) do
    Enum.map(map, fn({key, value}) -> {String.to_atom(key), value} end) # TODO fix vulnerability with to_existing_atom
  end
  def convert_to_klist(other) do
    %{}
  end

  def sync(conn, %{ "rest" => rest} = params) do

    # localhost is couchdb if in container environment

    url = "localhost:5984/" <> Enum.join(rest, "/")
    params = convert_to_klist(Map.delete(params, "rest"))
    IO.inspect url

    options = [hackney: [basic_auth: {"synctest", "abcdef"}],
               params: params]

    response = HTTPoison.get(url , %{}, options)
    IO.inspect response
    json(conn, %{})
  end

  def sync(conn, params) do
    options = [hackney: [basic_auth: {"synctest", "abcdef"}]]
    response = HTTPoison.get!("localhost:5984/admin" , %{}, options)
    IO.puts "a"
    json(conn, %{})
  end
end