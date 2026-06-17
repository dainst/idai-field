Field Hub may serve as a central synchronisation server for different projects using [Field Desktop](../desktop) clients.

In general there are two aspects to syncing Field data:
1. Image data
2. Database data

Image data is saved as files directly in filesystem, while everything else resides in a [CouchDB](https://couchdb.apache.org/) (Field Hub) or [PouchDB](https://pouchdb.com/) (Field Desktop). Field Hub serves as a simple reverse proxy to a CouchDB installation, because CouchDB and PouchDB are able to sync database states out of the box (see its official [documentation](https://docs.couchdb.org/en/stable/replication/index.html)). Besides this reverse proxy, the Field Hub application implements the image file syncing logic.

If you are already running your own CouchDB, you can install Field Hub alongside by setting its environment variables accordingly (see below). Each project creates its own database within CouchDB.

# Installation

## Recommended server specification

Field Hub is not that resource hungry when it comes to CPU and RAM usage. Your main concern should probably be the available hard drive space: Projects may produce a lot of high resolution images, so plan accordingly.

## Prerequisites

* [Docker](https://www.docker.com/)
* CouchDB installation

## Deployment

The Docker images are currently hosted in the Github Container Registry: https://github.com/dainst/idai-field/pkgs/container/field_hub.

**Environment variables**
* HOST, the host domain you will run the application from, for example "server.field.idai.world".
* SECRET_KEY_BASE, 64 character random string, see https://hexdocs.pm/phoenix/deployment.html#handling-of-your-application-secrets.
* COUCHDB_URL, base url to your CouchDB installation, for example "http://example.com:5984".
* COUCHDB_ADMIN_NAME, admin username for the CouchDB.
* COUCHDB_ADMIN_PASSWORD, admin password for the CouchDB.
* COUCHDB_USER_NAME, application user name used by Field Hub. The user will be created if you run the setup command.
* COUCHDB_USER_PASSWORD, application user password used by Field Hub.

**Volumes**

The Field Hub application will save synced images at `/files` within the Docker container. If you want to make the images persistent, you should therefore mount a host volume accordingly and make sure the container user [`nobody`](https://en.wikipedia.org/wiki/Nobody_(username)) has read/write access.

See also the [deployment example](https://github.com/dainst/idai-field/tree/master/server/deployment_example).

## Setting up projects

To create a new project, log in as the CouchDB Administrator.

On the initial page, you can see all projects on your Field Hub server. In a new installation the only thing you will see is the "Create new project" button. This will take you to the respective interface where you need to decide on a project identifier and a password.

### If you already have an existing project in Field Desktop

Make sure to use the same project identifier as in the Field Desktop application. If you are unsure what your project's identifier is, click on the name in the top right corner of the desktop application. This should open the "Edit Project" window, in the top bar you should be able to see the "Project name" in bold, followed by the project identifier. If you did not setup "Project name", you will only see the project identifier in bold.

Once you have created a project with the correct project identifier in Field Hub, you should be able to setup synchronization in the Desktop Application.

### If you want to start a new project

FieldHub only initializes an empty database, the actual project setup has to be done in Field Desktop, so: First create a new project in the Desktop client, setup your configuration as you would normally do. Afterwards create a project with matching project identifier in Field Hub, then synchronize from your Desktop application to the FieldHub server.

Other users should then use the "Download project" functionality in Field Desktop to get the newly setup project.

# Creating backups

Creating regular backups is recommended.

## Database

To backup CouchDB, please refer to its official [documentation](https://docs.couchdb.org/en/stable/maintenance/backups.html).

## Image files
As described in the [deployment](#deployment) section, files are stored at `/files` within the Docker container.

__In general, you should always mount a Docker volume at `/files` to avoid data loss when containers are recreated.__

Field Hub never discards image data: If Field Hub receives a `delete` request while syncing, the original file is kept and Field Hub creates an empty file of the same name with
a tombstone suffix (`<file UUID>.deleted`). Afterwards, Field Hub will treat the file as deleted while syncing.

# Restoring backups

Restoring backups under the same project name is tricky, because as long as one person still uses the old state and is actively syncing with Field Hub, the syncing logic will just fast forward from your restored backup to that person's state. We recommend therefore to restore backups with a new or updated project name.

1. Database

* If you backed up by copying `.couch` files, copy the backed up `.couch` file into your CouchDB's `data/shards` directory with a new database name: For example `my_project.1234567890.couch` may become `my_project_backup.1234567890.couch`.
* If you backed up using replication, replicate the backup with an updated name like `my_project_backup` into the CouchDB used by Field Hub.

Afterwards open your database in [Fauxton](https://couchdb.apache.org/fauxton-visual-guide/index.html) and search for the project's `Project` document:

```JSON
{
   "selector": {
      "resource.type": "Project"
   }
}
```

Open the document and update the `identifier` field to match the new project name and save the document.

2. Image files

Copy the backed up image files to Field Hub's image directory with the new name: `<path on your host>/files/my_project_backup/`. Make sure Field Hub is able to read/write the copied directory.

3. Recreate user

Run one of the `create_project_with_default_user` CLI functions to recreate a user for project `my_project_backup`. The script will give you feedback that the project already exists, but will create a new user and password anyway.

4. Inform your Field users

Now you can prompt your Field users to download the project `my_project_backup` with the new credentials.
