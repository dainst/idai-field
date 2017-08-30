# Configuration

The .template files are provided and the actual configuration file names are .gitignored ([see](.gitignore)) so developers can experiment with different configurations locally
without risking of committing actual real configurations to the repo.

## misc configs

When the clients starts for the first time, it creates a
`config.json` and several other config files `resources-state-*\`
at the users app dir for idai-field-client. On MacOS,
this is `/Users/<username>/Library/Application\ Support/idai-field-client/`.
These files contain view states, db and sync settings etc. 

### config.json - imagestorepath

The client uses one directory to store and manage all its media files.

* when omitted, image files are stored folder `idai-field-client/imagestore` under the OS app data path
 * %APPDATA% on Windows
 * $XDG_CONFIG_HOME or ~/.config on Linux
 * ~/Library/Application Support on macOS
* this can be overwritten by setting the imagestorepath to an absolute path in the config

## Configuration.json

During development, the client works with `config/Configuration.json`.
Initially it gets cloned from `config/Configuration.json.template`, when
calling `npm run build`. If the target file exists, `npm run build` will 
not overwrite it. If e2e tests fail with an adjusted `Configuration.json`, 
try deleting `config/Configuration.json` and run `npm run build`.
 
## Configuration.json - structure

[documentation](../docs/configuration-structure.md)


