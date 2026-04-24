import {
    AppConfigurator,
    CategoryForm,
    ConfigLoader,
    ConfigReader,
    ConfigurationDocument,
    Forest,
    getConfigurationName,
    ProjectConfiguration,
} from "idai-field-core";

import axios from "axios";

const couchdbDatabase = process.argv[2];
const couchdbUrl = process.argv[3];
const couchdbUser = process.argv[4];
const couchdbPassword = process.argv[5];
const originalProjectKey = process.argv[6];
const targetDocumentURL = process.argv[7];

async function start() {
    const configurationDocument = await getConfigurationDocument();

    const appConfigurator = new AppConfigurator(
        new ConfigLoader(new ConfigReader()),
    );
    let fullConfiguration;
    try {
        fullConfiguration = getForest(
            await appConfigurator.go(
                getConfigurationName(originalProjectKey),
                configurationDocument,
                true,
            ),
        );
    } catch (err) {
        console.error(
            `Error while trying to generate configuration file for project ${originalProjectKey}: `,
            err,
        );
    }

    return JSON.stringify(fullConfiguration);
}

async function getConfigurationDocument(): Promise<ConfigurationDocument> {
    return ConfigurationDocument.getConfigurationDocument(
        (_) => {
            return fetchConfigurationDocumentFromCouchdb();
        },
        new ConfigReader(),
        originalProjectKey,
        "user",
    );
}

async function fetchConfigurationDocumentFromCouchdb(): Promise<ConfigurationDocument> {
    let result;

    try {
        result = await axios.get(
            couchdbUrl + "/" + couchdbDatabase + "/configuration",
            {
                auth: {
                    username: couchdbUser,
                    password: couchdbPassword,
                },
            },
        );
    } catch (err) {
        if (err.response.status === 404) {
            throw ""; // Do not log 404 errors, as they are expected for older projects without configuration document
        } else {
            throw err;
        }
    }

    return result.data;
}

function getForest(
    projectConfiguration: ProjectConfiguration,
): Forest<CategoryForm> {
    return Forest.map((category: CategoryForm) => {
        category.children = [];
        delete category.parentCategory;
        return category;
    }, projectConfiguration.getCategories());
}

start().then(async (result) => {
    const response = await axios.get(targetDocumentURL,
        {
            auth: {
                username: couchdbUser,
                password: couchdbPassword,
            },
        });

    let doc = response.data

    // Add or replace previous configuration with the new one.
    doc["config"] = JSON.parse(result)

    await axios.put(
        targetDocumentURL,
        doc,
        {
            auth: {
                username: couchdbUser,
                password: couchdbPassword,
            },
        }
    )
    console.log(`configuration saved at ${targetDocumentURL}`);
});
