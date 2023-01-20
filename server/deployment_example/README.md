# Example deployment guide

This is a tutorial guide for deploying FieldHub. __This describes a very basic installation, so be aware that depending on your local hosting infrastructure, it may be useful or even be required to make adjustments. Using TLS is not covered in this guide and is highly recommended for security reasons.__

## Prerequisites

We will use [Docker](https://docs.docker.com/get-started/overview/) with [docker-compose](https://docs.docker.com/compose/). For this guide there are two Docker concepts to be aware of:
1. images
2. containers

You can think of a Docker image as the bundled blueprint for running an application, and of a Docker container as a running instance.

For more details please refer to the Docker/docker-compose documentation.

## Files

Alongside this README, you will find a simple [docker-compose.yml](docker-compose.yml). You may copy that file to your server (or desktop PC/laptop if you just want to try it out locally).

The docker-compose file describes 2 services: 
1. [CouchDB](https://couchdb.apache.org/), the database software FieldHub uses. CouchDB provides its own Docker images: https://hub.docker.com/_/couchdb
2. FieldHub, the application itself.

Additionally, an [.env](.env) file sets up some environment variables for docker-compose:

```
COUCHDB_USER=fieldhub_admin
COUCHDB_PASSWORD=fieldhub_password
COUCHDB_USER_NAME=app_user
COUCHDB_USER_PASSWORD=app_user_password
DB_DATA_DIRECTORY=./couch_data

FIELD_HUB_VERSION=3.2.0
HOST=localhost
SECRET_KEY_BASE=put_long_random_string_here_atleast_64_bytes_in_length_123456789
FILE_DIRECTORY=./files
```

Having Docker and docker-compose installed, you should be able to run the application with only these two files.

## Test run the application

Run the application from the directory containing both files with:

```
docker-compose up
```

This should run the application in the foreground and display logs for both services. The services can also be viewed in your webbrowser browser at port 80 (FieldHub service) and port 5984 (CouchDB service). For CouchDB's webinterface go to (..):5984/_utils/. Assuming you are trying this out on your local PC or Laptop, check [localhost](http://localhost) and [localhost:5984/_utils](http://localhost:5984/_utils).

You can now run [CLI](https://github.com/dainst/idai-field/wiki/FieldHub#manual) scripts in a second terminal, for example to finalize the CouchDB setup.

```
docker exec -it field-hub-app /app/bin/field_hub eval 'FieldHub.CLI.setup()'
```

Here `field-hub-app` is the container name, as defined in the docker-compose file.

The result should look something like this:

```
2023-01-18 12:44:42.897 [info] RUNNING SETUP
2023-01-18 12:44:42.921 [info] Running initial CouchDB setup for single node at http://couchdb:5984...
2023-01-18 12:44:43.723 [info] Created system database `_users`.
2023-01-18 12:44:43.723 [info] Created system database `_replicator`.
2023-01-18 12:44:44.458 [info] Created application user 'app_user'.
2023-01-18 12:44:44.585 [info] Setup done.
```

Next you can add a first project.

First, make sure the FieldHub user (within the container) owns the `FILE_DIRECTORY` on your host machine (see .env file). __This is only necessary after the first startup, not each time you add a new project.__

```
docker exec field-hub-app id
```

Should give you something like:
```
uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)
```

Use the `uid` to set the owner for `FILE_DIRECTORY`.
```
sudo chown 65534 files/
```

Next we create a project with a random password. 
```
docker exec -it field-hub-app /app/bin/field_hub eval 'FieldHub.CLI.create_project("my_first_project")'
```

The result should look something like this:
```
2023-01-18 12:47:54.879 [info] Creating project my_first_project.
2023-01-18 12:47:55.309 [info] Created project database 'my_first_project'.
2023-01-18 12:47:55.317 [info] Created directory for 'original_image'.
2023-01-18 12:47:55.317 [info] Created directory for 'thumbnail_image'.
2023-01-18 12:47:55.381 [info] Created user 'my_first_project' with password 'U/Sk/B6xjPLHP8gY+g35UITmOci8vS8L'.
2023-01-18 12:47:55.455 [info] Set user 'my_first_project' as member to project 'my_first_project'.
2023-01-18 12:47:55.456 [info] Project creation done.
```

If you want to set the password yourself, just add a second parameter (also see [CLI documentation](https://github.com/dainst/idai-field/wiki/FieldHub#manual)). In your `FILE_DIRECTORY` you should now have a directory called `my_first_project`, itself containing two directories `original_image` and `thumbnail_image`. In the CouchDB webinterface you should see a new database called `my_first_project`.

You should now be able to sync a Field Client with the server giving the above credentials and the servers domain or IP.

## Run the application in production

To run the application in production, you should do (atleast) 3 things:
1. Uncomment the restart policy parts in the docker-compose file
2. Setup docker daemon as a system service on your server (so that it starts after each server restart)
3. Set the environment, especially `COUCHDB_USER_PASSWORD` `COUCHDB_PASSWORD`, `HOST` and `SECRET_KEY_BASE`. See also the general [Wiki](https://github.com/dainst/idai-field/wiki/FieldHub).

Afterwards stop and delete all previously created test containers.

```
docker-compose down -v
```

Finally, we want to start everything in the background, using the detached `-d` option.

```
docker-compose up -d
```

If you want to see which containers are now running there are several commands.

To view resource usage:
```
docker stats
```

To view container information:
```
docker container ls
```

To view a container's logs:
```
docker logs <container name>
```

For more, please refer to the Docker documentation.
