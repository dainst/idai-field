# Example deployment guide

This is a tutorial guide for deploying FieldHub. __This describes a very basic installation, so be aware that depending on your local hosting infrastructure, it may be useful or even be required to make adjustments__.

## Prerequisites

We will use [Docker](https://docs.docker.com/get-started/overview/) with [docker-compose](https://docs.docker.com/compose/). For this guide there are two Docker concepts to be aware of:
1. images
2. containers

For the time being, you can think of a Docker image as the bundled blueprint for running an application, and of a Docker container as a running instance.

For more details please refer to the Docker/docker-compose documentation.

## Files

Alongside this README, you will find a simple [docker-compose.yml](docker-compose.yml). You may copy that file to your server (or desktop PC/laptop if you just want to try it out locally).

The docker-compose file describes 2 services: 
1. [CouchDB](https://couchdb.apache.org/), the database software FieldHub uses and provides its own Docker images: https://hub.docker.com/_/couchdb
2. FieldHub, the application itself.

For each service it is defined which image should be used to create containers.

Additionally, an [.env](.env) file sets up some environment variables for docker-compose:

```
COUCHDB_USER=fieldhub_admin
COUCHDB_PASSWORD=fieldhub_password
DB_DATA_DIRECTORY=./couch_data

FIELD_HUB_VERSION=3.0.0
FILE_DIRECTORY=./files
```

Having Docker and docker-compose installed, you should be able to run start the application with these two files.

## Test run the application

You should be able to run the application from the directory containing both files with:

```
docker-compose up
```

This should run the application in the foreground and display logs for both services. Both can also be viewed in the browser at Port 80 (FieldHub) and port 5984 (CouchDB), for CouchDBs webinterface go to (..):5984/_utils/. Assuming you are trying this out on your local PC or Laptop, check [localhost](http://localhost) and [localhost:5984/_utils](http://localhost:5984/_utils).

You can now run [CLI](../CLI.md) scripts in a second terminal, for example to finalize the CouchDB setup.

```
docker exec -it field-hub-app /app/bin/field_hub eval 'FieldHub.CLI.setup_couchdb_single_node()'
```

Here `field-hub-app` is the container name, as defined in the docker-compose file.

The result should look something like this:

```
09:36:58.581 [info] Running initial CouchDB setup for single node at http://couchdb:5984...
09:36:58.726 [info] Created system database `_users`.
09:36:58.726 [info] Created system database `_replicator`.
09:36:58.726 [info] Single node setup done.
```

Next you can add a first project.

First, make sure the FieldHub application (within the container) owns the `FILE_DIRECTORY` on your host machine (see .env file). __This is only necessary after the first startup, not each time you add a new project.__

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
docker exec -it field-hub-app /app/bin/field_hub eval 'FieldHub.CLI.create_project_with_default_user("my_first_project")'
```

The result should look something like this:
```
09:52:50.472 [info] Created project database 'my_first_project'.
09:52:50.479 [info] Created directory for thumbnail_image.
09:52:50.479 [info] Created directory for original_image.
09:52:50.572 [info] Created user 'my_first_project' with password 'Csrwe7OUzT8XCTxeP/+IlMHmXZvU9P03'.
09:52:50.572 [info] Adding 'my_first_project' as member for project 'my_first_project'.
```

If you want to set the password yourself, just add a second parameter (also see [CLI documentation](../CLI.md)). In your `FILE_DIRECTORY` you should now have a directory called `my_first_project`, itself containing two directories `original_image` and `thumbnail_image`. In the CouchDB webinterface you should see a new database called `my_first_project`.

You should now be able to sync a Field Client with the server giving the above credentials and the servers domain or IP.

## Run the application in production

To run the application in production, you should to (atleast) 3 things:
1. Uncomment the restart policy parts in the docker-compose file
2. Setup docker as a system service on your service (so that it starts after each restart)
3. Set the environment, especially `COUCHDB_PASSWORD`, `HOST` and `SECRET_KEY_BASE`. See also the general [README](../README.md).

Afterwards stop and delete all test containers.

```
docker-compose down -v
```

The result (if there were any containers running) should look like this:
```
[+] Running 3/3
 ⠿ Container field-hub-db            Removed                                                                                                                           1.6s
 ⠿ Container field-hub-app           Removed                                                                                                                           1.2s
 ⠿ Network deployment_guide_default  Removed                                                                                                                           0.2s
```

Finally, we want to start everything in the background, using the detached `-d` option.

```
docker-compose up -d
```

If you want to see which containers are now running there are several commands. Please refer to the Docker documentation.

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
