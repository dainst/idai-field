# Configuration

For starting the app or running the e2e tests, it is expected that the files

```
idai-field-client/config/config.json
idai-field-client/config/Configuration.json
```

exist. These files are provided as template files. These get automatically created
by `npm run build` from their template suffixed counterparts in case they do not exist.

The template files are meant to show general usage. See below for more in depth discussion of configuration options.

**Important note regarding e2e testing:** Although other configurations may work, too, the .template suffixed
files are the ones proven to work for the e2e tests. 
In case you experience problems with the tests, provide the .template configuratons and test again.

The .template files are provided and the actual configuration file names are .gitignored ([see](.gitignore)) so developers can experiment with different configurations locally
without risking of committing actual real configurations to the repo.

## config.json

### imagestorepath

The client uses one directory to store and manage all its media files.

* when omitted, image files are stored folder `idai-field-client/imagestore` under the OS app data path
 * %APPDATA% on Windows
 * $XDG_CONFIG_HOME or ~/.config on Linux
 * ~/Library/Application Support on macOS
* this can be overwritten by setting the imagestorepath to an absolute path in the config

### environment

* test -> the db gets cleared on every reload
* production -> for production use

### backend

If the backend property is set, syncing unsynced 
project resources automatically to a remote server is enabled.

Example:

```
"backend" : {
    "uri": "server url",
    "credentials": "username:password",
    "connectionCheckInterval": 5000
}
```

* server address -> url
* username:password
* backend.connectionCheckInterval -> value in ms. 

If ommitted, syncing is disabled.

## Configuration.json

In addition to the general rules for 
[Configuration.json](https://github.com/dainst/idai-components-2/blob/master/docs/configuration.md),
there are a few additional ones, regarding the iDAI.field 2 configuration.

In iDAI.field 2, the fields `identifier` and `shortDescription`
automatically get added to every defined type, if not defined
explicitely.

Furthermore, the `image` type has to be defined. Otherwise the
application won't start.


