import { to } from 'tsfun';
import { CategoryForm, Datastore, Document, IdGenerator, Named, ProjectConfiguration,
    RelationsManager } from 'idai-field-core';
import { Importer, ImporterFormat, ImporterOptions, ImporterReport } from '../../../components/import/importer';
import { Settings } from '../../settings/settings';
import { MD } from '../../../components/messages/md';
import { getErrorMessage } from './util/get-error-message';


interface RequestParameters {
    format: ImporterFormat;
    operationIdentifier: string;
    categoryName: string;
    merge: boolean;
    permitDeletions: boolean;
    ignoreUnconfiguredFields: boolean;
    separator: string;
}


/**
 * @author Thomas Kleinke
 */
export async function importData(request: any, response: any, projectConfiguration: ProjectConfiguration,
                                 datastore: Datastore, relationsManager: RelationsManager, idGenerator: IdGenerator,
                                 settings: Settings, messagesDictionary: MD) {

    try {
        const { operationIdentifier, categoryName, merge, permitDeletions, ignoreUnconfiguredFields,
            separator, format } = getRequestParameters(request);

        const category: CategoryForm = projectConfiguration.getCategory(categoryName);
        if (!category) throw 'Unconfigured category: ' + categoryName;

        const options: ImporterOptions = await getImporterOptions(format, merge, permitDeletions,
            operationIdentifier, ignoreUnconfiguredFields, category, separator, datastore);
        const documents: Array<Document> = await Importer.doParse(options, request.body);
        const report: ImporterReport = await performImport(projectConfiguration, datastore, relationsManager,
            idGenerator, settings, options, documents
        );

        if (report.errors?.length) {
            response.status(400).send({
                error: 'Import failed',
                importErrors: report.errors?.map(error => getErrorMessage(error, messagesDictionary))
            })
        } else {
            response.status(200).send({
                successfulImports: report.successfulImports,
                ignoredIdentifiers: report.ignoredIdentifiers
            });
        }
    } catch (err) {
        response.status(400).send({ error: getErrorMessage(err, messagesDictionary) });
    }
}


function getRequestParameters(request: any): RequestParameters {

    const operationIdentifier: string = request.query.operation;
    const categoryName: string = request.query.category ?? 'Project';
    const merge: boolean = request.query.merge === 'true';
    const permitDeletions: boolean = request.query.permitDeletions === 'true';
    const ignoreUnconfiguredFields: boolean = request.query.ignoreUnconfiguredFields === 'true';
    const separator: string = request.query.separator ?? ',';
    const format: ImporterFormat = getFormat(request);

    return { operationIdentifier, categoryName, merge, permitDeletions, ignoreUnconfiguredFields,
        separator, format };
}


function getFormat(request: any): ImporterFormat {

    let format: string = request.params.format;
    if (!['geojson', 'csv', 'jsonl'].includes(format)) throw 'Unsupported format: ' + format;

    if (format === 'jsonl') format = 'native';

    return format as ImporterFormat;
}


async function getImporterOptions(format: ImporterFormat, mergeMode: boolean, permitDeletions: boolean,
                                  operationIdentifier: string, ignoreUnconfiguredFields: boolean,
                                  category: CategoryForm, separator: string,
                                  datastore: Datastore): Promise<ImporterOptions> {

    const options: ImporterOptions = {
        format,
        mergeMode,
        permitDeletions,
        selectedOperationId: await getOperationId(operationIdentifier, datastore),
        ignoreUnconfiguredFields,
        selectedCategory: category,
        separator,
        sourceType: 'file'
    };

    if (options.mergeMode === true) options.selectedOperationId = '';

    return options;
}


async function getOperationId(operationIdentifier: string, datastore: Datastore): Promise<string|undefined> {

    if (!operationIdentifier) return undefined;

    const documents: Array<Document> = (await datastore.find(
        { constraints: { 'identifier:match': operationIdentifier } }
    )).documents;

    return documents.length === 1
        ? documents[0].resource.id
        : undefined;
}


function performImport(projectConfiguration: ProjectConfiguration, datastore: Datastore,
                       relationsManager: RelationsManager, idGenerator: IdGenerator, settings: Settings,
                       options: ImporterOptions, documents: Array<Document>): Promise<ImporterReport> {

    return Importer.doImport(
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
}

