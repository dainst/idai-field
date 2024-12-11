# Example deployment guide

This is a tutorial guide for deploying Field Hub. __This describes a very basic installation, so be aware that depending on your local hosting infrastructure, it may be useful or even be required to make adjustments. Using TLS is not covered in this guide and is highly recommended for security reasons.__

## Prerequisites

We will use [Docker](https://docs.docker.com/get-started/overview/) with [docker-compose](https://docs.docker.com/compose/). For this guide there are two Docker concepts to be aware of:
1. images
2. containers

You can think of a Docker image as the bundled blueprint for running an application, and of a Docker container as a running instance.

For more details please refer to the Docker/docker-compose documentation.

## Files

Alongside this README, you will find a simple [docker-compose.yml](docker-compose.yml). You may copy that file to your server (or desktop PC/laptop if you just want to try it out locally).

The docker-compose file describes 2 services: 
1. [CouchDB](https://couchdb.apache.org/), the database software Field Hub uses. CouchDB provides its own Docker images: https://hub.docker.com/_/couchdb
2. Field Hub, the application itself.

Additionally, an [.env](.env) file sets up some environment variables for docker-compose:

```
COUCHDB_ADMIN_NAME=fieldhub_admin
COUCHDB_ADMIN_PASSWORD=fieldhub_password
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

The first thing we should do is create a directory for the application to store the synchronized files in. In the directory run

```
mkdir files && chown nobody files/
```

_Note: if you want the files to be put somewhere else, you can do that by updating the `FILE_DIRECTORY` environment variable in the [.env](.env) file._

Run the application from the directory containing both files with:

```
docker-compose up
```

This should run the application in the foreground and display logs for both services. The services can also be viewed in your webbrowser at port 80 (FieldHub service) and port 5984 (CouchDB service). For CouchDB's webinterface go to (..):5984/_utils/. 

Assuming you are trying this out on your local PC or Laptop, check [localhost](http://localhost) and [localhost:5984/_utils](http://localhost:5984/_utils).

### Creating a project

Open http://localhost and login with the CouchDB admin credentials as defined in your [.env](.env) file. You should be able to create new projects in your browser. Create a project `my_first_project`, you can set a custom password or have Field Hub generate one for you.

After project creation, your `FILE_DIRECTORY` you should now have a directory with the name `my_first_project`, itself containing two directories `original_image` and `thumbnail_image`. In the CouchDB webinterface you should see a new database called `my_first_project`. Both the database and the file directories are empty at this point.

You can now create a `my_first_project` project in your Field Desktop application and should then be able to sync a Field Client with the server given the correct credentials and the servers domain or IP. Of course, if you already have a Field Desktop project you can instead repeat the steps above but replace `my_first_project` with the project key of your Field Desktop project.

### Collaborating

After you have created and setup `my_first_project` in your Field Desktop application and synced it to your Field Hub instance on a server, others can use the "Download project" option in Field Desktop to get the project and start collaborating. They __must__ use "Download project", __not__ create a new project `my_first_project` on their own, because the latter will cause data conflicts.

## Using the application in production

To run the application in production, you should do (atleast) 3 things:
1. Uncomment the restart policy parts in the docker-compose file
2. Setup docker daemon as a system service on your server (so that it starts after each server restart)
3. Set the environment, especially `COUCHDB_ADMIN_PASSWORD` `COUCHDB_USER_PASSWORD`, `HOST` and `SECRET_KEY_BASE`. See also the general [Wiki](https://github.com/dainst/idai-field/wiki/Field-Hub).

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
