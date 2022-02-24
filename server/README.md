# FieldHub

## Prerequisites

* Elixir >= 1.12 (Development)
* Docker & docker-compose


## Building a new docker image version

The images are currently hosted in the Github Container Registry: [FieldHub](https://github.com/dainst/idai-field/pkgs/container/field_hub)

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

In order to push images, you have authenticate your local machine with the the registry, see: [Github Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).



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
Install dependencies, finish the CouchDB setup as single node and seed an iDAI.field project and some users:

```bash
mix setup
```

Start Phoenix the server:

```bash
mix phx.server
``` 

You should now be able to add http://localhost:4000 (or your machines IP address) as a sync target in your desktop/mobile client.

On how to create additional projects and users see [CLI.md](CLI.md), the same module is used for setup and seeding (see `aliases` function in [mix.exs](mix.exs)).
