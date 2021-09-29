# IdaiFieldServer

## Prerequisites

* Docker
* docker-compose

## Getting started

### Preparations

    $ docker-compose up postgres
    $ mix ecto.setup # or `mix ecto.create` and `mix ecto.migrate`
    $ docker-compose up couchdb
    $ curl -X PUT http://synctest:abcdef/localhost:5984/synctest

### Run

#### On host machine

    $ mix phx.server      
    Visit localhost:4000

#### In container 

    $ docker-compose run --entrypoint "mix phx.server" server
    Visit localhost:4000

## Connect iDAI.field Desktop

Sync to couchdb (planned to go via server soon) by setting up a project `synctest` 
and setting password to `abcdef`. Then activate sync.

## Development

## Testing

    $ mix test                                                # run on your local machine
    $ docker-compose run --entrypoint "mix test" server       # run inside Docker container

### Working with Containers

Access mix and elixir inside container

    $ docker-compose run --entrypoint "/bin/bash" server 
    $ mix test
