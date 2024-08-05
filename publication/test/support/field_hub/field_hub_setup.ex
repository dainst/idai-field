defmodule FieldHubHelper do
  @retry_timeout 2000
  require Logger

  def start() do
    {"", 0} =
      System.cmd("docker compose", [
        "-f",
        "test/support/field_hub/docker-compose.yml",
        "pull"
      ])

    {"", 0} =
      System.cmd("docker compose", [
        "-f",
        "test/support/field_hub/docker-compose.yml",
        "up",
        "-d"
      ])

    await_startup()

    seed_project_docs =
      File.read!("test/support/fixtures/seed_project/publication_data.json")
      |> Jason.decode!()
      |> then(fn %{"rows" => rows} ->
        Enum.map(rows, fn %{"doc" => doc} ->
          Map.delete(doc, "_rev")
        end)
      end)

    seed_project_identifier =
      Enum.find(seed_project_docs, fn %{"_id" => uuid} = _doc ->
        uuid == "project"
      end)
      |> then(fn %{"resource" => %{"identifier" => identifier}} -> identifier end)

    Finch.build(
      :post,
      "#{get_url()}/projects/#{seed_project_identifier}",
      headers(),
      Jason.encode!(%{
        "password" => get_project_password()
      })
    )
    |> Finch.request(FieldPublication.Finch)

    Finch.build(
      :post,
      "#{get_url()}/db/#{seed_project_identifier}/_bulk_docs",
      headers(),
      Jason.encode!(%{docs: seed_project_docs})
    )
    |> Finch.request(FieldPublication.Finch)

    File.ls!("test/support/fixtures/seed_project/images/")
    |> Enum.map(fn uuid ->
      Finch.build(
        :put,
        "#{get_url()}/files/#{seed_project_identifier}/#{uuid}?type=original_image",
        headers() ++ [{"Content-Type", "image/x-www-form-urlencoded"}],
        File.read!("test/support/fixtures/seed_project/images/#{uuid}")
      )
      |> Finch.request(FieldPublication.Finch)
    end)
  end

  def stop() do
    {"", 0} =
      System.cmd("docker compose", [
        "-f",
        "test/support/field_hub/docker-compose.yml",
        "down"
      ])
  end

  def get_project_password() do
    "pw"
  end

  def get_url() do
    "http://localhost:4003"
  end

  def get_admin_name() do
    "fieldhub_integration_test_admin"
  end

  def get_admin_password() do
    "pw"
  end

  defp await_startup(ms_waited \\ 0) do
    if ms_waited > 20000 do
      stop()
      raise("FieldHub failed to start after 20 seconds, aborting.")
    end

    Finch.build(
      :get,
      get_url(),
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:error, %Mint.TransportError{reason: :closed}} ->
        Process.sleep(@retry_timeout)
        await_startup(ms_waited + @retry_timeout)

      {:ok, %Finch.Response{status: 200}} ->
        {_log_output, 0} =
          System.shell(
            "docker exec -i fieldhub_integration_test_app /app/bin/field_hub eval 'FieldHub.CLI.setup()'"
          )

        :field_hub_started
    end
  end

  defp headers() do
    credentials =
      "#{get_admin_name()}:#{get_admin_password()}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end
end
