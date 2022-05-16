# CLI Interface

The [FieldHub.CLI](lib/field_hub/cli.ex) module implements a range of CLI functions.

## General usage

### Production

To call the CLI (from within your FieldHub docker container) functions use the pattern:

```
/app/bin/field_hub eval 'FieldHub.CLI.<function_name>("<string parameter>")'.
```

For example add a user by running:

```
/app/bin/field_hub eval 'FieldHub.CLI.create_user("simon_hohl", "very_secret_password")'
```

### Development

To call the CLI functions using `mix` use the pattern:

```
mix run -e 'FieldHub.CLI.<function_name>("<string parameter>")'
```

For example add a user by running:
```
mix run -e 'FieldHub.CLI.create_user("simon_hohl", "very_secret_password")'
```

## Available commands

### `FieldHub.CLI.setup_couchdb_single_node()`
Runs a basic single node setup for CouchDB, required only if your CouchDB has not been initialized at all.

### `FieldHub.CLI.create_project("<project_name>")`
Creates a new project with name `<project_name>`.

### `FieldHub.CLI.delete_project("<project_name>")`
Deletes the project with name `<project_name>`

### `FieldHub.CLI.create_project_with_default_user("<project_name>", "<user_password>")`
Creates a project with name `<project_name>`, adds a user with name `<project_name>` and password `<user_password>`.

### `FieldHub.CLI.create_project_with_default_user("<project_name>")`
Creates a project with name `<project_name>`, adds a user with name `<project_name>` and a random password (make sure to write it down).

### `FieldHub.CLI.create_user("<user_name>", "<user_password>")`
Creates a user with name `<user_name>` and password `<user_password>`.

### `FieldHub.CLI.create_user("<user_name>")`
Creates a user with name `<user_name>` and a random password (make sure to write it down).

### `FieldHub.CLI.delete_user("<user_name>)`
Deletes the user with name `<user_name>`.

### `FieldHub.CLI.set_password("<user_name>", "<user_password>")`
Sets new password `<user_password>` for user with name `<user_name>`.

### `FieldHub.CLI.add_user_as_project_member("<user_name>", "<project_name>")`
Adds user with name `<user_name>` to project with name `<project_name>`.

### `FieldHub.CLI.remove_user_from_project("<user_name>", "<project_name>")`
Removes user with name `<user_name>` from project with name `<project_name>`.
