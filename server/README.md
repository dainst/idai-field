# IdaiFieldServer

## Prerequisites

* Docker
* docker-compose

## Getting started

### Preparations

  $ docker-compose up postgres
  $ mix ecto.setup
  $ npm install
 
### Run

  $ mix phx.server                                          # run on your local machine
  visit localhost:4000
  $ docker-compose run --entrypoint "mix phx.server" server # run inside Docker container
  visit localhost:4000

## Development

## Testing

  $ mix test                                                # run on your local machine
  $ docker-compose run --entrypoint "mix test" server       # run inside Docker container

### Working with Containers

Access mix and elixir inside container

  $ docker-compose run --entrypoint "/bin/bash" server 
  $ mix test
