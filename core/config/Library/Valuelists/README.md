# General

This directory contains definitions for the valuelists that can be used for fields of certain input types (e. g. dropdown, checkboxes, radio).

## File Overview

* [Valuelists.json](Valuelists.json): Contains the valuelist definitions (including value ids, external references, custom order, creator, creation date).
* Language.default.[language].json: Contains label translations for the default valuelists. If no label is specified for a language, the value id is displayed as the label. These labels can be translated in [weblate](https://weblate.dainst.org), to do so add the german key value pairs and update the Valuelists.json (see above).
* Language.projects.[language].json: Contains label translations for valuelists that were defined by different excavation projects that work with Field. The translations for these valuelists are provided by the respective projects and are __not__ translated using Weblate.