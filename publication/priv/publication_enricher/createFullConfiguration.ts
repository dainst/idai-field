import {
    AppConfigurator, CategoryForm, ConfigLoader, ConfigReader, ConfigurationDocument, Forest,
    getConfigurationName, ProjectConfiguration
} from 'idai-field-core';

import axios from 'axios';

const projectName = process.argv[2];
const couchdbUrl = process.argv[3];
const couchdbUser = process.argv[4];
const couchdbPassword = process.argv[5];


async function start() {

    const configurationDocument = await getConfigurationDocument(
        couchdbUrl, couchdbUser, couchdbPassword, projectName
    );

    const appConfigurator = new AppConfigurator(new ConfigLoader(new ConfigReader()));
    let fullConfiguration;
    try {
        fullConfiguration = getForest(
            await appConfigurator.go(
                getConfigurationName(projectName),
                configurationDocument,
                true
            )
        );
    } catch (err) {
        console.error(`Error while trying to generate configuration file for project ${projectName}: `, err);
    }


    return JSON.stringify(fullConfiguration)
}


async function getConfigurationDocument(couchdbUrl: string, couchdbUser: string, couchdbPassword: string,
    projectName: string): Promise<ConfigurationDocument> {

    return ConfigurationDocument.getConfigurationDocument(
        (_) => {
            return fetchConfigurationDocumentFromCouchdb(couchdbUrl, couchdbUser, couchdbPassword, projectName);
        },
        new ConfigReader(),
        projectName,
        'user'
    );
}


async function fetchConfigurationDocumentFromCouchdb(couchdbUrl: string, couchdbUser: string, couchdbPassword: string,
    projectName: string): Promise<ConfigurationDocument> {

    let result;

    try {
        result = await axios.get(
            couchdbUrl + '/' + projectName + '/configuration',
            {
                auth: {
                    username: couchdbUser,
                    password: couchdbPassword
                }
            }
        );
    } catch (err) {
        if (err.response.status === 404) {
            throw ''; // Do not log 404 errors, as they are expected for older projects without configuration document
        } else {
            throw err;
        }
    }

    return result.data;
}



function getForest(projectConfiguration: ProjectConfiguration): Forest<CategoryForm> {

    return Forest.map((category: CategoryForm) => {
        category.children = [];
        delete category.parentCategory;
        return category;
    }, projectConfiguration.getCategories());
}

const result = await start();

console.log(result);