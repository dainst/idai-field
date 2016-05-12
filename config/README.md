# Configuration

For starting the app or running the e2e tests, it is expected that the files

```
idai-field-client/config/config.json
idai-field-client/config/Configuration.json
```

exist. For that purpose you can simply take the files

```
idai-field-client/config/config.json.template
idai-field-client/config/Configuration.json.template
```

and create copies of them cutting the .template suffix. 
The template files show general usage. See below for more in depth discussion of configuration options.

**Important note regarding e2e testing:** Although other configurations may work, too, the .template suffixed
files are the ones proven to work for the e2e tests. 
In case you experience problems with the tests, provide the .template configuratons and test again.

The .template files are provided and the actual configuration file names are .gitignored ([see](.gitignore)) so developers can experiment with different configurations locally
without risking of committing actual real configurations to the repo.

## config.json

### environment

* test -> the db gets cleared on every reload
* production -> for production use

### targetPlatform

* desktop -> for running as electron packaged app, includes menus to access certain features not available when option is not active
* (OMIT PARAM) -> suitable for viewing in browser, also suitable for e2e testing

### backend.uri

* server address

### backend.credentials

* username:password

### backend.connectionCheckInterval
    
* value in ms. 

## Configuration.json
