import {includedIn, isNot, on} from 'tsfun';
import {Query} from 'idai-components-2/src/datastore/query';
import {ISRECORDEDIN_CONTAIN} from '../../c';
import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {CSVExporter} from '../../core/export/csv-exporter';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {Find, ResourceTypeCount} from './export-helper';


/**
 * @author Daniel de Oliveira
 */
export module CsvExportHelper {
    
    
    export async function performExport(find: Find,
                                        filePath: string,
                                        csvExportMode: string,
                                        selectedOperationId: string,
                                        selectedType: IdaiType) {

        try {
            CSVExporter.performExport(
                csvExportMode === 'complete'
                    ? await fetchDocuments(find, selectedOperationId, selectedType)
                    : [],
                selectedType,
                filePath);

        } catch (err) {
            console.error(err);
        }
    }
    

    export async function determineTypeCounts(find: Find,
                                              selectedOperationId: string,
                                              typesList: Array<IdaiType>): Promise<Array<ResourceTypeCount>> {

        const exclusion = ['Operation', 'Project', 'Image', 'Drawing', 'Photo']
            .concat(selectedOperationId === 'project' ? [] : ['Place', 'Survey', 'Trench', 'Building']);

        const resourceTypes =
            typesList
                .filter(on('name',
                    isNot(includedIn(exclusion))));

        const resourceTypeCounts: Array<ResourceTypeCount> = [];
        for (let resourceType of resourceTypes) { // TODO make asyncReduce in tsfun
            const query = getQuery(resourceType.name, selectedOperationId);
            resourceTypeCounts.push([
                resourceType,
                (await find(query)).documents.length]);
        }
        return resourceTypeCounts.filter(_ => _[1] > 0);
    }


    function getQuery(typeName: string, selectedOperationId: string) {

        const query: Query = {
            types: [typeName],
            constraints: {}
        };
        if (selectedOperationId !== 'project') {
            (query.constraints as any)[ISRECORDEDIN_CONTAIN] = selectedOperationId;
        }
        return query;
    }


    async function fetchDocuments(find: Find,
                                  selectedOperationId: string,
                                  selectedType: IdaiType): Promise<Array<FieldDocument>> {

        try {
            const query = getQuery(selectedType.name, selectedOperationId);
            return (await find(query)).documents;
    
        } catch (msgWithParams) {
            console.error(msgWithParams);
            return [];
        }
    }
}