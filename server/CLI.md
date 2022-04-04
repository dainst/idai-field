# CLI Interface

The [FieldHub.CLI](lib/field_hub/cli.ex) module implements a range of CLI functions.


## Production

To call the CLI functions use the pattern:

```
docker exec -it <app container name> /app/bin/field_hub eval 'FieldHub.CLI.<function_name>("<string parameter>")'.
```

For example initialize Couch DB by running:

```
docker exec -it field-hub-app /app/bin/field_hub eval 'FieldHub.CLI.setup_couchdb_single_node()'
```

## Development

To call the CLI functions using `mix` use the pattern:

```
mix run -e 'FieldHub.CLI.<function_name>("<string parameter>")'
```

For example add a user by running:
```
mix run -e 'FieldHub.CLI.create_user("simon_hohl", "very_secret_password")'
```
