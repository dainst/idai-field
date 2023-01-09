# FieldHub

FieldHub serves as a central synchronisation server for [Field Desktop](../desktop) clients.

## Usage

Please refer to the [wiki](https://github.com/dainst/idai-field/wiki/FieldHub).

## Development

### Prerequisites

* [Docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)
* [Elixir](https://elixir-lang.org/) >= 1.13

Create an `.env` file:

```
cp .env_template .env
```

If you change the default CouchDB credentials in your `.env` file, make sure to also adjust [config/config.exs](config/config.exs).

### CouchDB
Start a dockerized CouchDB:

```bash
docker-compose up
```

### Phoenix Server
Install dependencies, finish the CouchDB setup as single node and seed a project and user. This is a custom command defined in `aliases` in [mix.exs](mix.exs).

```bash
mix setup
```

Start the server:

```bash
mix phx.server
``` 

FieldHub is now running at http://localhost:4000 as a sync target for Field Desktop. If you want to access the CouchDB directly, you can do so at http://localhost:5984/_utils.

Run unit tests with:

```bash
mix test --cover
``` 

Apply automatic formatting before committing code with:
```
mix format
```

### CLI Interface

The [FieldHub.CLI](lib/field_hub/cli.ex) module implements a range of CLI functions.

To call the CLI functions using `mix` use the pattern:

```
mix run -e 'FieldHub.CLI.<function_name>("<string parameter>")'
```

For example add a user by running:
```
mix run -e 'FieldHub.CLI.create_user("simon_hohl", "very_secret_password")'
```

## Building a new docker image version

In the commands below you should change the image names according to your institution (`ghcr.io/dainst` are the official images created by the DAI).

To build a new image run:

```bash
docker build . -t ghcr.io/dainst/field_hub:latest
```

Alternatively, you may want to tag a new release version:
```bash
docker build . -t ghcr.io/dainst/field_hub:<MAJOR>.<MINOR>.<PATCH>
```

Finally you have to push the new or updated image to the registry:
```
docker push ghcr.io/dainst/field_hub:<version>
```

In order to push images, you have to authenticate your local machine with the registry, see: [Github Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

