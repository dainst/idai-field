import Config

# depending on intended environment, make a copy as either 'prod.exs' or 'dev.exs'

config :api,
  elasticsearch_url: "elasticsearch:9200",
  elasticsearch_index_prefix: "idai-field",
  # must end with slash
  cantaloupe_url: "http://cantaloupe:8182/iiif/2/",
  gazetteer_url: "https://gazetteer.dainst.org",
  # TODO: deprecate
  projects: ["db1", "db2", "db3"],
  # TODO: deprecate
  locales: ["de", "en"],
  # TODO: deprecate
  rights: %{
    users: [
      %{name: "user-1", pass: "pass-1", admin: true}
    ],
    readable_projects: %{
      "user-1" => ["a", "b", "c", "d"],
      "anonymous" => ["a"]
    }
  },
  couchdb_url: "http://localhost:5985",
  couchdb_admin_name: "couch_admin",
  couchdb_admin_password: "couch_admin_password",
  couchdb_user_name: "app_user",
  couchdb_user_password: "app_user_password",
  known_data_sources: ["http://localhost:4000"],
  file_store_directory_root: "data/file_store",
  fix_couch_source_url: true

config :api, Api.Auth.Guardian,
  issuer: "api",
  secret_key: "Secret key. You can use `mix guardian.gen.secret` to get one"
