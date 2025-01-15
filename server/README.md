# Field Hub

Field Hub serves as a central synchronisation server for [Field Desktop](../desktop) clients.

## Usage

Please refer to the [wiki](https://github.com/dainst/idai-field/wiki/FieldHub).

## Development

### Prerequisites

* [Docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)
* [Elixir](https://elixir-lang.org/) >= 1.13

For Linux make sure to install `inotify-tools`.

For Ubuntu make sure to install `erlang-dev` and `erlang-xmerl`.

Create an `.env` file:

```
cp .env_template .env
```

If you change the default CouchDB credentials in your `.env` file, make sure to also adjust [config/config.exs](config/config.exs).

### CouchDB
Start a dockerized CouchDB:

```bash
docker compose up
```

Or, if you want to run docker in the background:

```bash
docker compose up -d
```

### Phoenix Server

Field Hub is written in [Elixir](https://elixir-lang.org/) with the [Phoenix Framework](https://www.phoenixframework.org/).

Field Hub tries to follow the Elixir and Phoenix conventions when it comes to naming and directory structure. For detailed guides please consult the official documentation.

### Project setup

Install dependencies:

```bash
mix deps.get
```

Start the server:

```bash
mix phx.server
``` 

Field Hub is now running at http://localhost:4000 as a sync target for Field Desktop. If you want to access the CouchDB directly, you can do so at http://localhost:5984/_utils.

Run unit tests with:

```bash
mix test --cover
``` 

Apply automatic formatting before committing code with:
```
mix format
```

### Running specific functions


To call functions using `mix` use the pattern:

```
mix run -e 'FieldHub.CLI.<function_name>("<string parameter>")'
```

The [FieldHub.CLI](lib/field_hub/cli.ex) module implements a range of CLI functions. For example add a user by running:
```
mix run -e 'FieldHub.CLI.create_user("simon_hohl", "very_secret_password")'
```

You can run any function defined in the project this way, the CLI module just has the cleaner interface and is also viable in production.

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

