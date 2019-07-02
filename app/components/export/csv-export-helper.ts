import {includedIn, isNot, on, asyncMap} from 'tsfun';
import {Query} from 'idai-components-2/src/datastore/query';
import {ISRECORDEDIN_CONTAIN} from '../../c';
import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {CSVExporter} from '../../core/export/csv-exporter';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {Find, GetIdentifierForId, ResourceTypeCount} from './export-helper';
import {clone} from '../../core/util/object-util';


/**
 * @author Daniel de Oliveira
 */
export module CsvExportHelper {

    export const BASE_EXCLUSION = ['Operation', 'Project', 'Image', 'Drawing', 'Photo'];
    const ADD_EXCLUSION = ['Place', 'Survey', 'Trench', 'Building'];


    /**
     * @param find
     * @param filePath
     * @param selectedOperationId
     * @param selectedType
     * @param relations
     * @param getIdentifierForId
     */
    export async function performExport(find: Find,
                                        filePath: string,
                                        selectedOperationId: string|undefined,
                                        selectedType: IdaiType,
                                        relations: string[],
                                        getIdentifierForId: GetIdentifierForId) {

        // TODO technical ids in relations must be replaces with identifiers

        try {
            await CSVExporter.performExport(
                selectedOperationId
                    ? await fetchDocuments(find, selectedOperationId, selectedType, getIdentifierForId)
                    : [],
                selectedType,
                relations,
                filePath);

        } catch (err) {
            console.error(err);
        }
    }


    export function getTypesWithoutExcludedTypes(types: Array<IdaiType>, exclusion: string[]) {

        return types.filter(on('name', isNot(includedIn(exclusion))))
    }



    /**
     * @param find
     * @param selectedOperationId
     * @param typesList
     */
    export async function determineTypeCounts(find: Find,
                                              selectedOperationId: string|undefined,
                                              typesList: Array<IdaiType>): Promise<Array<ResourceTypeCount>> {

        if (!selectedOperationId) return determineTypeCountsForSchema(typesList);

        const resourceTypes =
            getTypesWithoutExcludedTypes(
                typesList,
                BASE_EXCLUSION.concat(selectedOperationId === 'project' ? [] : ADD_EXCLUSION));

        const resourceTypeCounts: Array<ResourceTypeCount> = [];
        for (let resourceType of resourceTypes) { // TODO make asyncReduce in tsfun
            const query = getQuery(resourceType.name, selectedOperationId);
            resourceTypeCounts.push([
                resourceType,
                (await find(query)).documents.length]);
        }
        return resourceTypeCounts.filter(_ => _[1] > 0);
    }


    function determineTypeCountsForSchema(typesList: Array<IdaiType>): Array<ResourceTypeCount> {

        const resourceTypes = getTypesWithoutExcludedTypes(typesList, BASE_EXCLUSION);
        return resourceTypes.map(type => [type, -1] as ResourceTypeCount);
    }


    /**
     * Fetches documents, clones them and replaces ids with identifiers
     *
     * @param find
     * @param selectedOperationId
     * @param selectedType
     * @param getIdentifierForId
     */
    async function fetchDocuments(find: Find,
                                  selectedOperationId: string,
                                  selectedType: IdaiType,
                                  getIdentifierForId: GetIdentifierForId): Promise<Array<FieldDocument>> {

        try {
            const query = getQuery(selectedType.name, selectedOperationId);
            const fetchedDocuments = (await find(query)).documents as Array<FieldDocument>;

            return asyncMap(async (document: FieldDocument) => {

                const clonedDocument: FieldDocument = clone(document); // because we will modify it
                if (!clonedDocument.resource.relations) return clonedDocument;

                for (let relation of Object.keys(clonedDocument.resource.relations)) {

                    const newTargets = [];
                    for (let target of clonedDocument.resource.relations[relation]) {
                        newTargets.push(await getIdentifierForId(target));
                    }
                    clonedDocument.resource.relations[relation] = newTargets;
                }
                return clonedDocument;

            })(fetchedDocuments);

        } catch (msgWithParams) {
            console.error(msgWithParams);
            return [];
        }
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
}