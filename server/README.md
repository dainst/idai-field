# FieldHub

FieldHub serves as a central synchronisation server for [Field Desktop](../desktop) clients.

There are two aspects to syncing Field data:
1. Image data
2. Database data

Image data is held directly in filesystem, while the database syncing is handled by [CouchDB](https://couchdb.apache.org/) (FieldHub) or [PouchDB](https://pouchdb.com/) (Field Desktop). FieldHub serves as a simple reverse proxy to a CouchDB installation and implements the image data syncing. 

If you are already running your own CouchDB, you can install FieldHub alongside by setting its environment variables accordingly (see below).

## Prerequisites

* [Docker](https://www.docker.com/)
* CouchDB installation (Deployment)
* [Elixir](https://elixir-lang.org/) >= 1.12 (Development)
* [docker-compose](https://docs.docker.com/compose/) (Development)

## CLI

FieldHub provides its own command line interface, which is documented separately in [CLI.md](CLI.md).

## Deployment

The Docker images are currently hosted in the Github Container Registry: https://github.com/dainst/idai-field/pkgs/container/field_hub.

### Environment variables
* HOST, the host domain you will run the application from, for example "server.field.idai.world". (required)
* SECRET_KEY_BASE, see https://hexdocs.pm/phoenix/deployment.html#handling-of-your-application-secrets (required)
* COUCHDB_URL, base url to your CouchDB installation, for example "http://example.com:5984". (required)
* COUCHDB_ADMIN_NAME, admin username for the CouchDB (optional, required for FieldHub CLI scripts)
* COUCHDB_ADMIN_PASSWORD, admin password for the CouchDB (optional, required for FieldHub CLI scripts)

### Volumes
The application will save images at `/files` within the container. If you want to make the images persistent, you should therefore mount a host volume accordingly.

For an example deployment configuration using docker-compose (including a CouchDB and Traefik) see: [docker-compose.deploy.yml](docker-compose.deploy.yml)

## Development
Create an `.env` file:

```
cp .env_template .env
```

If you change the default CouchDB credentials in your `.env` file, make sure to also adjust [config/dev.exs](config/dev.exs) and [config/test.exs](config/test.exs).

### CouchDB
Start a dockerized CouchDB:

```bash
docker-compose up
```

### Phoenix Server
Install dependencies, finish the CouchDB setup as single node and seed a project and user:

```bash
mix setup
```

Start the server:

```bash
mix phx.server
``` 

FieldHub is now running at http://localhost:4000 as a sync target for Field Desktop. If you want to access the CouchDB directly, you can do so at http://localhost:5984/_utils.


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
