import { CategoryForm, Datastore, Document, ProjectConfiguration, Query } from 'idai-field-core';
import { GeoJsonExporter } from '../../../components/export/geojson-exporter';
import { CsvExporter } from '../../../components/export/csv/csv-exporter';
import { ExportResult, ExportRunner } from '../../../components/export/export-runner';


/**
 * @author Thomas Kleinke
 */
export async function exportData(request: any, response: any, projectConfiguration: ProjectConfiguration,
                                 datastore: Datastore) {
    
    try {
        const format: 'csv'|'geojson' = request.params.format === 'geojson' ? 'geojson' : 'csv';
        const categoryName: string = request.query.category ?? 'Project';
        let context: string = request.query.context; 
        const csvSeparator: string = request.query.separator ?? ',';
        const combineHierarchicalRelations: boolean = request.query.combineHierarchicalRelations !== 'false';
        const formatted: boolean = request.query.formatted !== 'false';

        const category: CategoryForm = projectConfiguration.getCategory(categoryName);
        if (!category) throw 'Unconfigured category: ' + categoryName;

        if (context && context !== 'project') {
            const documents: Array<Document> = (await datastore.find(
                { constraints: { 'identifier:match': context } }
            )).documents;
            context = documents.length === 1
                ? documents[0].resource.id
                : undefined;
        }
            
        if (format === 'csv') {
            const result: ExportResult = await ExportRunner.performExport(
                (query: Query) => datastore.find(query),
                (async resourceId => (await datastore.get(resourceId)).resource.identifier),
                context,
                category,
                projectConfiguration
                    .getRelationsForDomainCategory(categoryName)
                    .map(_ => _.name),
                CsvExporter.performExport(
                    projectConfiguration.getProjectLanguages(),
                    csvSeparator,
                    combineHierarchicalRelations
                )
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
