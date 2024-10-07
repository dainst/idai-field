# Field Publication

Field Publication is the publication plattform for Field projects. 

# Development

## Prerequisites

* [Docker](https://www.docker.com/)
* [Elixir](https://elixir-lang.org/) >= 1.14

## 1. Starting auxiliary services with docker

Field Publication relies on several services:
- [OpenSearch](https://opensearch.org/) as the search engine.
- [CouchDB](https://couchdb.apache.org) as the database.
- [Cantaloupe](https://cantaloupe-project.github.io/) as the [IIIF](https://iiif.io/) image server.

The [docker-compose.yml](docker-compose.yml) defines all three services for development. For starting the dockerized services run:
```
docker-compose up
```

## 2. Running the setup

We define a mix command `alias` for the setup (see [mix.exs](mix.exs)):
```
mix setup
```

## 3. Running the application
Now you may start the Phoenix application with either
```
mix phx.server
```

or, if you want to use Elixir's interactive `iex` REPL to interact with the application directly from the command line

```
iex -S mix phx.server
```

Now you can visit [`localhost:4001`](http://localhost:4001) in your browser and should see the landing page. The next step would be to login as the COUCHDB_USER as defined in the [docker-compose.yml](docker-compose.yml). 


## 4. Seed Project for Development
By running

```
mix seed
```

you can add a local copy of 'testopolis' as a finished publication for testing during development.