import {to, zip} from 'tsfun';
import {clone} from 'tsfun/struct';
import {AppConfigurator} from '../../app/core/configuration/app-configurator';
import {ConfigLoader} from '../../app/core/configuration/boot/config-loader';
import {ProjectConfiguration} from '../../app/core/configuration/project-configuration';
import {mapTreeList, TreeList, zipTreeList} from '../../app/core/util/tree-list';
import {Category} from '../../app/core/configuration/model/category';
import {PROJECT_MAPPING} from '../../app/core/settings/settings-service';
import {Group} from '../../app/core/configuration/model/group';
import {FieldDefinition} from '../../app/core/configuration/model/field-definition';
import {ConfigReader} from '../../app/core/configuration/boot/config-reader';

const fs = require('fs');


const CONFIG_DIR_PATH = 'src/config';
const OUTPUT_DIR_PATH = 'release';
const LANGUAGES = ['de', 'en'];

if (!fs.existsSync(OUTPUT_DIR_PATH)) fs.mkdirSync(OUTPUT_DIR_PATH);
if (!fs.existsSync(OUTPUT_DIR_PATH + '/config')) fs.mkdirSync(OUTPUT_DIR_PATH + '/config');


function writeProjectConfiguration(fullProjectConfiguration: any, project: string) {

    fs.writeFileSync(
        `${OUTPUT_DIR_PATH}/config/${project}.json`,
        JSON.stringify(fullProjectConfiguration,null, 2)
    );
}


function getTreeList(projectConfiguration: ProjectConfiguration) {

    return mapTreeList((category: Category) => {

        delete category.children;
        delete category.parentCategory;
        return category;
    }, projectConfiguration.getCategoryTreelist());
}


function mergeLayer(merge: any, locales: string[], localizedItems: Array<any>) {

    return zip(localizedItems).map(merge(locales));
}


const mergeCategories = (locales: string[]) => (categories: Array<Category>) => {

    const result: any = clone(categories[0]);

    result.label = {};
    result.description = {};
    for (let i = 0; i < locales.length; i++) {
        result.label[locales[i]] = categories[i].label;
        if (categories[i].description) result.description[locales[i]] = categories[i].description;
    }

    result.groups = mergeLayer(mergeGroup, locales, categories.map(to('groups')));
    return result as Category;
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
        result.label[locales[i]] = localizedFields[i].label;
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
    delete field.sameMainCategoryResource;

    return field;
}


async function start() {

    for (const [projectName, configName] of Object.entries(PROJECT_MAPPING)) {
        console.log('');
        const localizedTreeLists: { [locale: string]: TreeList<Category>} = {};
        for (const language of LANGUAGES) {
            const appConfigurator = new AppConfigurator(new ConfigLoader(new ConfigReader()));
            try {
                localizedTreeLists[language] = getTreeList(await appConfigurator.go(CONFIG_DIR_PATH, configName, [language]));
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
