# FieldHub

## Prerequisites

* Elixir >= 1.12
* Docker & docker-compose

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

You may want to finalize the setup at http://localhost:5984/_utils/#/setup as "Single Node" using the credentials defined in your [.env](.env_template) file.

### Phoenix Server
Install dependencies and seed an iDAI.field project and some users:

```bash
mix setup
```

Start Phoenix the server:

```bash
mix phx.server
``` 

You should now be able to add http://localhost:4000 (or your machines IP address) as a sync target in your desktop/mobile client.

On how to create additional projects and users see [CLI.md](CLI.md).

## Deployment

TODO
<!-- Now you can visit [`localhost:4000`](http://localhost:4000) from your browser. -->

<!-- Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html). -->
