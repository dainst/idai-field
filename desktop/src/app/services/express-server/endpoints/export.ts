import { CategoryForm, Datastore, Document, ProjectConfiguration, Query } from 'idai-field-core';
import { GeoJsonExporter } from '../../../components/export/geojson-exporter';
import { CsvExporter } from '../../../components/export/csv/csv-exporter';
import { ExportResult, ExportRunner } from '../../../components/export/export-runner';

interface RequestParameters {
    format: string;
    categoryName: string;
    context: string;
    csvSeparator: string;
    combineHierarchicalRelations: boolean;
    formatted: boolean;
} 


/**
 * @author Thomas Kleinke
 */
export async function exportData(request: any, response: any, projectConfiguration: ProjectConfiguration,
                                 datastore: Datastore) {
    
    try {
        const { format, categoryName, csvSeparator, combineHierarchicalRelations,
            formatted, context } = await getRequestParameters(request, datastore);

        const category: CategoryForm = projectConfiguration.getCategory(categoryName);
        if (!category) throw 'Unconfigured category: ' + categoryName;
            
        if (format === 'csv') {
            const result: ExportResult = await performCsvExport(projectConfiguration, datastore, context, category,
                csvSeparator, combineHierarchicalRelations
            );
            
            response.header('Content-Type', 'text/csv')
                .status(200)
                .send(result.exportData.join('\n'));
        } else {
            const geojsonData: string = await GeoJsonExporter.performExport(datastore, context, undefined, formatted);

            response.header('Content-Type', 'application/geo+json')
                .status(200)
                .send(geojsonData);
        }
    } catch (err) {
        console.error(err);
        const errorMessage: string = err?.message ?? err;
        response.status(400).send({ error: errorMessage });
    }
}


async function getRequestParameters(request: any, datastore: Datastore): Promise<RequestParameters> {

    const format: 'csv'|'geojson' = request.params.format === 'geojson' ? 'geojson' : 'csv';
    const categoryName: string = request.query.category ?? 'Project';
    const csvSeparator: string = request.query.separator ?? ',';
    const combineHierarchicalRelations: boolean = request.query.combineHierarchicalRelations !== 'false';
    const formatted: boolean = request.query.formatted !== 'false';
    const context: string = await getContext(request, datastore);

    return { format, categoryName, csvSeparator, combineHierarchicalRelations, formatted, context };
}


async function getContext(request: any, datastore: Datastore): Promise<string> {

    let context: string = request.query.context ?? 'project';

    if (context !== 'project') {
        const documents: Array<Document> = (await datastore.find(
            { constraints: { 'identifier:match': context } }
        )).documents;

        context = documents.length === 1
            ? documents[0].resource.id
            : undefined;
    }

    return context;
}


async function performCsvExport(projectConfiguration: ProjectConfiguration, datastore: Datastore, context: string,
                                category: CategoryForm, csvSeparator: string,
                                combineHierarchicalRelations: boolean): Promise<ExportResult> {

    return ExportRunner.performExport(
        (query: Query) => datastore.find(query),
        (async resourceId => (await datastore.get(resourceId)).resource.identifier),
        context,
        category,
        projectConfiguration
            .getRelationsForDomainCategory(category.name)
            .map(relation => relation.name),
        CsvExporter.performExport(
            projectConfiguration.getProjectLanguages(),
            csvSeparator,
            combineHierarchicalRelations
        )
    );
}