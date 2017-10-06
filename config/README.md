# Configuration

There are two different configurations in idai-field-client. 

The first, **config.json**,
is of purely technical nature and under normal circumstances there should be no necessity 
to edit or see it. It is meant to hold the maintain the clients state across reloads. When 
the clients starts for the first time, it creates a `config.json` and several other config files `resources-state-*\`
at the users app dir for idai-field-client. On MacOS, this is `/Users/<username>/Library/Application\ Support/idai-field-client/`.

The second, **Configuration.json**, is meant to be edited as the domain experts see fit. See
[here](../docs/configuration-structure.md) for the documentation of its structure.

During development, the client works with `config/Configuration.json`.
Initially it gets cloned from `config/Configuration.json.template`, when
calling `npm run build`. If the target file exists, `npm run build` will 
not overwrite it. If e2e tests fail with an adjusted `Configuration.json`, 
try deleting `config/Configuration.json` and run `npm run build`.

Configuration.json.template is provided and 
negatively .gitignored ([see](.gitignore)) to make sure that no extra 
files in this folder, like for example your local config/Configuration.json, 
get added to the repo by accident.






