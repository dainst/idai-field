Field Desktop is currently provided by the development team in English and German. Translations for all other languages are managed by the community. This page explains the why and how of translating the application (user interface and configuration) into a new language or participating in the translation effort for one of the already available languages.

## Purpose

Field Desktop is the main desktop (**MacOS**, **Windows** and **Linux**) application for collecting data. Any new version release requires the user interface to be translated immediately. Therefore a structured process is required to enable the community to participate. The following steps are to be taken if a private person or an organization wants to be involved.

## Translation management
The translations are managed with [Weblate](https://docs.weblate.org/de/weblate-4.17/index.html). Please consult the documentation for any questions on specific functionality like the statistics. This wiki focuses on the practical translation of Field Desktop and its components. The DAI manages the translations for Field Desktop in [a publicly visible Weblate project](https://weblate.dainst.org/projects/field-desktop/). If you click on the project you will see many components with a visual representation of the translation status.

![Field Desktop Weblate project](https://github.com/dainst/idai-field/assets/29372760/45f70d63-51d9-4210-a77f-ed61c4154876)

All the components besides the manual (see below) are listed here.

**The components of the software are:**
* [Application initialization](https://weblate.dainst.org/projects/field-desktop/application-initialization/)
* [Application window](https://weblate.dainst.org/projects/field-desktop/application-window/)
* [User interface](https://weblate.dainst.org/projects/field-desktop/user-interface/)

**The components of the configuration are:**
* [Configuration (Core)](https://weblate.dainst.org/projects/field-desktop/configuration-core/)
* [Configuration (Library)](https://weblate.dainst.org/projects/field-desktop/configuration-library/)
* [Configuration templates](https://weblate.dainst.org/projects/field-desktop/configuration-templates/)
* [Default valuelists](https://weblate.dainst.org/projects/field-desktop/default-valuelists/)

Additionally the [Sample data](https://weblate.dainst.org/projects/field-desktop/sample-data/) can be translated as well.
The [glossary](https://weblate.dainst.org/projects/field-desktop/glossary/) can be used to ensure consistency of translations across components.

## How to participate

### 1. Register to Weblate
To get the right to translate into a certain language, registration is required. If you have any questions about the registration process feel free to contact the development team, but there is nothing out of the ordinary here.

![image](https://github.com/dainst/idai-field/assets/29372760/a9b944b4-ebe0-4763-a8fd-69aa04e41d93)

After successful registration, you will be sent a confirmation link. Follow the link to confirm your registration and login to your account.

### 2. Create an issue for the language(es) you want to translate in

Next, create an issue in the [Field Desktop repository](https://github.com/dainst/idai-field). Please tell us your Weblate username and which languages you want to translate into, see screenshot. Use the label "translation" as shown below.

![image](https://github.com/dainst/idai-field/assets/29372760/f6aeb537-364f-4cbd-8d3c-c45154f02e53)
One of the admins will add you to the groups as quickly as possible so you can start.

If you want to become an admin for the language, mention this in the issue as well. Admins will be able to review the translations and be responsible for responding when a new version of Field Desktop is released.


### 3. Translate!

Activate project watching in the Field Desktop project (Projects > Browse all projects > select Field Desktop > Watch project Field Desktop).

Pick the language that you are translating (if you have more than one) and pick an option to start with. The navigation options all have an explanatory pop up text that appears when you hover over the icon.

![image](https://github.com/dainst/idai-field/assets/29372760/9cad8d6b-d9bc-4c7c-8d0f-4113b4d89fb1)

Under "Strings status" you can see the unfinished strings and strings marked for edit. If you click on "Unfinished strings" you will see all strings that still need to be translated for this specific language. Clicking on "Browse" lets you look through the strings, "Translate" brings you into translation mode and "Zen" changes into zen mode. In zen mode you see all items that are to be displayed in one single list that can be scrolled through without switching the page. This mode is also useful for translating (see below).

The most important components of the application are the _User interface_, the _Application window_ and the _Application initialization_. The _Core Configuration_ should also be translated, but will not grow with every version.

When there are new terms added to the application window, they will show up on the top. When you click on "Translate" all the terms will appear in a new window.

![image](https://github.com/dainst/idai-field/assets/29372760/8512d5f3-90ed-4547-9348-ff1bdf331b99)

#### Navigation options while translating
At the top of the page, the options display 1/50 strings in this section (see screenshots), besides that are the option to go to the beginning, back and to the next string or to the last one. Next to the basic navigation options at the top of the page, there is a search bar. Here you can type in a word to search for; the search is performed within the translation, the key and also the language translated from. You also have a lot of filter options here, e. g. string:needs-editing shows all strings that were flagged with "needs editing". The results of a search are shown and can be navigated through. If no results are available, a message will appear that no strings were found.
![image](https://github.com/dainst/idai-field/assets/29372760/7dbee389-80a9-46cc-8fe7-ddf5fdd9ac4c)

In the translation window (note the top-right option to create a permalink to this item) the first part in the example (see screenshot) displays the German translation of the key, which is displayed at the top right. Next to the German text there is a button to copy the string to the clipboard and right beside it one that clones the string into the translation (English in the example).

![image](https://github.com/dainst/idai-field/assets/29372760/1fcefbe6-e96f-4adb-a5d1-2681d6210b6f)

Right below the translation of the language you are translating into is displayed, each translation can be flagged as "Needs editing". They are automatically flagged as needing editing when the original (German) string has changed or it has been flagged manually.

![image](https://github.com/dainst/idai-field/assets/29372760/a6204504-238c-4eb0-ac35-cc51b8c82e2a)

Different characters and control signs can be added directly to the translation with the options being displayed right above the translation.
Below the strings, you have the option to skip the string or to save the translation and continue.

#### Using the glossary
Weblate [glossaries](https://docs.weblate.org/en/latest/user/glossary.html) are useful for managing and controlling vocabularies within one language over all translations. They are designed to increase consistency throughout the translation. The available terms can also be managed centrally to ensure consistency across the application. Glossary terms are translated the same way as regular strings.
To access the glossary, click on the bottom option "Glossary". At the point of this manual being written there are only two terms in the glossary, color and project. These terms can be extended upon.
![image](https://github.com/dainst/idai-field/assets/29372760/d98802e9-282d-4314-9c4f-491ad66474f8)

Within the glossary all available strings and translations can be viewed and untranslated terms can be translated.
While translating any other part of the application the proper glossary terms can be chosen and will be suggested when close string matches for the available terms are found (see below).
![image](https://github.com/dainst/idai-field/assets/29372760/c0ffda73-2c7c-42da-8c8c-3ee6f1d6b63a)


## Translating the user manual

The manual is currently available [here](https://github.com/dainst/idai-field/tree/master/desktop/src/manual). It is not managed by Weblate and has to be translated separately at the moment. If you are interested in offering a translation don't hesitate to contact the team!

## Problems and questions
Please feel free to point out any problems with the English or German translations and create an [issue](https://github.com/dainst/idai-field/issues) to make the development team aware of any mistakes.
