/*import { Document } from 'idai-field-core';

const fs = require('fs');
const axios = require('axios');

const projectName = process.argv[2];
const couchdbUrl = process.argv[3];
const couchdbUser = process.argv[4];
const couchdbPassword = process.argv[5];


async function fetchConfigurationDocumentFromCouchdb(couchdbUrl: string, couchdbUser: string, couchdbPassword: string,
                                                     projectName: string): Promise<Array<Document>> {

    const result = await axios.get(
        couchdbUrl + '/' + projectName + '/_all_docs?include_docs=true',
        {
            auth: {
                username: couchdbUser,
                password: couchdbPassword
            }
        }
    );

    return result.data.rows.map(row => row.doc);
}


async function start(couchdbUrl: string, couchdbUser: string, couchdbPassword: string,
                     projectName: string): Promise<void> {

    const documents: Array<Document> = await fetchConfigurationDocumentFromCouchdb(
        couchdbUrl, couchdbUser, couchdbPassword, projectName
    );

    const csvString: string = createCSVString(documents);
    fs.writeFileSync('export-' + projectName + '.csv', csvString);
}


function createCSVString(documents: Array<Document>): string {

    return 'Technischer Identifier;Selbstgewählter Identifier;Kategorie;Kurzbeschreibung\n'.concat(documents.map(document => {
        return getDocumentCSV(document);
    }).join('\n'));
}


function getDocumentCSV(document: Document): string {

    return document.resource.id + ';'
        + '"' + document.resource.identifier + '";'
        + document.resource.type + ';'
        + '"' + (document.resource.shortDescription ?? '') + '"';
}

start(couchdbUrl, couchdbUser, couchdbPassword, projectName).then(() => console.log('Finished!'));
*/