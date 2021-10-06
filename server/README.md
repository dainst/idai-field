# IdaiFieldServer

## Prerequisites

* Docker
* docker-compose

## Getting started

### Preparations

    $ npm i --prefix=./assets
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

## API

Note that subsequently calls to `GET /files/:project/path/to/file.png` are shorthands for `GET https://user:pwd@hostname:port/files/:project/path/to/file.png`. Typically the user has the same name as the `:project` to be accessed.

Get a file, if `path/to/file.png` exists and is a file.

```
GET /files/:project/path/to/file.png
```

Get a recursive directory listing of all files under a certain path, if
the given `path/to/files` is a directory

```
GET /files/:project/path/to/files
```

When the path does not exist, an error, wrapped in a JSON object, is returned.

To post a new file, use

```
POST /files/:project/path/to/file.png
```

`/path/to/` gets created in case it does not yet exist. The request will be rejected if the file already exists.

To delete a file, use

```
DELETE /files/:project/path/to/file.png
```

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
