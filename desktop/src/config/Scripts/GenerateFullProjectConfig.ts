import {to, zip} from 'tsfun';
import {clone} from 'tsfun/struct';
import {AppConfigurator} from '../../app/core/configuration/app-configurator';
import {ConfigLoader} from '../../app/core/configuration/boot/config-loader';
import {ProjectConfiguration} from '../../app/core/configuration/project-configuration';
import {mapTreeList, TreeList, zipTreeList} from '../../app/core/util/tree-list';
import { CategoryForm } from '../../app/core/configuration/model/category';
import {PROJECT_MAPPING} from '../../app/core/settings/settings-service';
import {Group} from '../../app/core/configuration/model/group';
import {FieldDefinition} from '../../app/core/configuration/model/field-definition';
import {ConfigReader} from '../../app/core/configuration/boot/config-reader';
import {Settings} from '../../app/core/settings/settings';

const fs = require('fs');
const cldr = require('cldr');

PROJECT_MAPPING['default'] = 'Default';


const CONFIG_DIR_PATH = 'src/config';
const OUTPUT_DIR_PATH = 'release';
const LANGUAGES = getLanguages();

if (!fs.existsSync(OUTPUT_DIR_PATH)) fs.mkdirSync(OUTPUT_DIR_PATH);
if (!fs.existsSync(OUTPUT_DIR_PATH + '/config')) fs.mkdirSync(OUTPUT_DIR_PATH + '/config');


function writeProjectConfiguration(fullProjectConfiguration: any, project: string) {

    fs.writeFileSync(
        `${OUTPUT_DIR_PATH}/config/${project}.json`,
        JSON.stringify(fullProjectConfiguration,null, 2)
    );
}


function getTreeList(projectConfiguration: ProjectConfiguration) {

    return mapTreeList((category: CategoryForm) => {

        delete category.children;
        delete category.parentCategory;
        return category;
    }, projectConfiguration.getCategoryTreelist());
}


function mergeLayer(merge: any, locales: string[], localizedItems: Array<any>) {

    return zip(localizedItems).map(merge(locales));
}


const mergeCategories = (locales: string[]) => (categories: Array<CategoryForm>) => {

    const result: any = clone(categories[0]);

    result.label = {};
    result.description = {};
    for (let i = 0; i < locales.length; i++) {
        if (categories[i].label) result.label[locales[i]] = categories[i].label;
        if (categories[i].description) {
            Object.keys(categories[i].description).forEach(languageCode => {
                result.description[languageCode] = categories[i].description[languageCode];
            });
        }
    }

    result.groups = mergeLayer(mergeGroup, locales, categories.map(to('groups')));
    return result as CategoryForm;
};


const mergeGroup = (locales: string[]) => (localizedGroups: Array<Group>) => {

    const result: any = clone(localizedGroups[0]);

    result.label = {};
    for (let i = 0; i < locales.length; i++) {
        result.label[locales[i]] = localizedGroups[i].label;
    }

    result.fields = mergeLayer(mergeField, locales, localizedGroups.map(to('fields')));
    result.relations = mergeLayer(mergeField, locales, localizedGroups.map(to('relations')));

    return result as Group;
};


const mergeField = (locales: string[]) => (localizedFields: Array<any>) => {

    const result: any = clone(localizedFields[0]);

    result.label = {};
    result.description = {};
    for (let i = 0; i < locales.length; i++) {
        if (localizedFields[i].label) result.label[locales[i]] = localizedFields[i].label;
        if (localizedFields[i].description) result.description[locales[i]] = localizedFields[i].description;
    }

    return cleanField(result);
};


function cleanField(field: any): FieldDefinition {

    delete field.group;
    delete field.visible;
    delete field.editable;
    delete field.allowOnlyValuesOfParent;
    delete field.constraintIndexed;
    delete field.domain;
    delete field.range;
    delete field.inverse;

    return field;
}


function getLanguages(): string[] {

    return Object.keys(cldr.extractLanguageDisplayNames(Settings.getLocale()))
        .filter(language => language.length === 2);
}


async function start() {

    for (const [projectName, project] of Object.entries(PROJECT_MAPPING)) {
        console.log('');
        const localizedTreeLists: { [locale: string]: TreeList<CategoryForm>} = {};
        for (const language of LANGUAGES) {
            console.log('Loading configuration for language: ' + language);
            const appConfigurator = new AppConfigurator(new ConfigLoader(new ConfigReader()));
            try {
                localizedTreeLists[language] = getTreeList(
                    await appConfigurator.go(
                        CONFIG_DIR_PATH,
                        project.prefix !== 'default' ? project.prefix : undefined,
                        [language]
                    )
                );
            } catch (err) {
                console.error(`Error while trying to generate full configuration for project ${projectName} and language ${language}:`, err);
            }
        }

        const fullConfiguration = zipTreeList(mergeCategories(LANGUAGES), Object.values(localizedTreeLists) as any);
        writeProjectConfiguration(fullConfiguration, projectName);
    }
}


start().then(() => {
    console.log('\nFinished generating configuration files.');
});
