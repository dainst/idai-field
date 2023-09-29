project_identifier = "test"
user_name = "fieldhub_integration_test"
user_password = "pw"

encoded =
  "#{user_name}:#{user_password}"
  |> Base.encode64()


Finch.build(
  :put,
  "http://localhost:5986/#{project_identifier}",
  [
    {"Content-Type", "application/json"},
    {"Authorization", "Basic #{encoded}"}
  ]
)
|> Finch.request(FieldPublication.Finch)

fixtures_directory = "../server/test/fixtures/complete_project"

docs =
  "#{fixtures_directory}/project_export.jsonl"
  |> File.read!()
  |> String.split("\n")
  |> Enum.reject(fn value ->
    value == ""
  end)
  |> case do
    # Remove `_rev` entries in order to be able to import into a new database.
    [_metadata, docs, _seq] ->
      Jason.decode!(docs)
      |> Map.get("docs")
      |> Enum.map(fn doc ->
        doc
        |> Map.delete("_rev")
        |> Map.delete("_revisions")
      end)
  end

payload =
  %{docs: docs}
  |> Jason.encode!()

encoded =
  "#{user_name}:#{user_password}"
  |> Base.encode64()

Finch.build(
  :post,
  "http://localhost:5986/#{project_identifier}/_bulk_docs",
  [
    {"Content-Type", "application/json"},
    {"Authorization", "Basic #{encoded}"}
  ],
  payload
)
|> Finch.request(FieldPublication.Finch)
|> IO.inspect()
