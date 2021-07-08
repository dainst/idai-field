import Config

config :logger, level: :error

config :api,
  projects: ["a", "b"],
  image_dir: "test/resources/images",
  rights: %{
    users: [
      %{ name: "user-1", pass: "pass-1" },
      %{ name: "user-2", pass: "pass-2" },
      %{ name: "user-3", pass: "pass-3" },
      %{ name: "user-5", pass: "pass-5", admin: true }
    ],
    readable_projects: %{
      "user-1" => ["a", "b", "c", "d"],
      "user-2" => ["a", "b", "c"],
      "user-3" => ["a", "b"],
      "anonymous" => ["a"]
    }
  },
  default_filters: [
    %{
      field: "field1",
      label: %{ de: "Feld 1", en: "Field 1" }
    },
    %{
      field: "field2",
      label: %{ de: "Feld 2", en: "Field 2" }
    },
    %{
      field: "field3",
      label: %{ de: "Feld 3", en: "Field 3" }
    }
  ]

config :api, Api.Auth.Guardian,
       issuer: "api",
       secret_key: "znQNeSqapxKso80yjsM5yuO/0vvPjgFi86lcNk6o8tZL+ccCUawi9FScQuE9IcO5"
