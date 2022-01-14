# FieldHub

## Development 

### CouchDB
Start a dockerized CouchDB:

```bash
docker-compose up
```

### Phoenix

Install dependencies and seed some initial couchdb data with:

```bash
mix setup
```

Start Phoenix endpoint with:

```bash
mix phx.server
``` 

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

<!-- Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html). -->
