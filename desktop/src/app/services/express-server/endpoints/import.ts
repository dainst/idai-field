import { to } from 'tsfun';
import { CategoryForm, Datastore, Document, IdGenerator, Named, ProjectConfiguration, RelationsManager } from 'idai-field-core';
import { Importer, ImporterFormat, ImporterOptions, ImporterReport } from '../../../components/import/importer';
import { Settings } from '../../settings/settings';


/**
 * @author Thomas Kleinke
 */
export async function importData(request: any, response: any, projectConfiguration: ProjectConfiguration,
                                 datastore: Datastore, relationsManager: RelationsManager, idGenerator: IdGenerator,
                                 settings: Settings) {

    try {
        const operationIdentifier: string = request.query.operation;
        const categoryName: string = request.query.category ?? 'Project';
        const category: CategoryForm = projectConfiguration.getCategory(categoryName);
        if (!category) throw 'Unconfigured category: ' + categoryName;

        let format: string = request.params.format;
        if (!['geojson', 'csv', 'jsonl'].includes(format)) throw 'Unsupported format: ' + format;
        if (format === 'jsonl') format = 'native';

        let operationId: string;
        if (operationIdentifier) {
            const documents: Array<Document> = (await datastore.find(
                { constraints: { 'identifier:match': operationIdentifier } }
            )).documents;
            operationId = documents.length === 1
                ? documents[0].resource.id
                : undefined;
        }

        const fileContent: string = request.body;

        const options: ImporterOptions = {
            format: format as ImporterFormat,
            mergeMode: request.query.mergeMode === 'true',
            permitDeletions: request.query.permitDeletions === 'true',
            selectedOperationId: operationId,
            ignoreUnconfiguredFields: request.query.ignoreUnconfiguredFields === 'true',
            selectedCategory: category,
            separator: request.query.separator ?? ',',
            sourceType: 'file'
        };
        if (options.mergeMode === true) options.selectedOperationId = '';

        const documents: Array<Document> = await Importer.doParse(options,fileContent);

        const report: ImporterReport = await Importer.doImport(
            {
                datastore: datastore,
                relationsManager: relationsManager,
                imageRelationsManager: undefined,
                imagestore: undefined
            },
            {
                settings,
                projectConfiguration: projectConfiguration,
                operationCategories: projectConfiguration.getOperationCategories().map(Named.toName)
            },
            () => idGenerator.generateId(),
            options,
            documents,
            projectConfiguration.getTypeCategories().map(to(Named.NAME)),
            projectConfiguration.getImageCategories().map(to(Named.NAME))
        );

        if (report.errors?.length) {
            response.status(400).send({ error: 'Import failed', importErrors: report.errors })
        } else {
            response.status(200).send({
                successfulImports: report.successfulImports,
                ignoredIdentifiers: report.ignoredIdentifiers
            });
        }
    } catch (err) {
        console.error(err);
        const errorMessage: string = err?.message ?? err;
        response.status(400).send({ error: errorMessage });
    }
}
