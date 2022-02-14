# CLI Interface

The [FieldHub.CLI](lib/field_hub/cli.ex) module implements a range of CLI functions.

## Development

To call the CLI functions using `mix` use the pattern:

```
mix run -e 'FieldHub.CLI.<function_name>("<string parameter>")'
```

For example add a user by running:
```
mix run -e 'FieldHub.CLI.create_user("simon_hohl", "very_secret_password")'
```

## Production

TODO