import { ConfigurationDocument, ConfigurationSerializer, ConfigReader } from 'idai-field-core';

const PouchDB = window.require('pouchdb-browser');


/**
 * @author Thomas Kleinke
 */
export async function exportConfiguration(request: any, response: any, configReader: ConfigReader,
                                          configurationSerializer: ConfigurationSerializer, username: string) {

    try {
        const projectIdentifier: string = request.params.project;
        const formatted: boolean = request.query.formatted !== 'false';
        const database = new PouchDB(projectIdentifier);
        const info = await database.info();

        if (info.update_seq === 0) {
            response.status(404).send({
                reason: 'The project "' + projectIdentifier + '" could not be found.'
            });
        } else {
            const configurationDocument: ConfigurationDocument = await ConfigurationDocument.getConfigurationDocument(
                database.get, configReader, projectIdentifier, username
            );
            const result = await configurationSerializer.getConfigurationAsJSON(
                projectIdentifier, configurationDocument
            );
            response.header('Content-Type', 'application/json')
                .status(200)
                .send(JSON.stringify(result, null, formatted ? 2 : undefined));
        }
    } catch (err) {
        console.error(err);
        response.status(500).send({ reason: 'An unknown error occurred.' });
    }
}
