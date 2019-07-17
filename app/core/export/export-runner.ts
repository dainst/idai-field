import {includedIn, isNot, on, asyncMap, to} from 'tsfun';
import {Query} from 'idai-components-2/src/datastore/query';
import {ISRECORDEDIN_CONTAIN} from '../../c';
import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {clone} from '../util/object-util';
import {Find, GetIdentifierForId, PerformExport, ResourceTypeCount} from './export-helper';


/**
 * Fetches documents, rewrites identifiers in relations, triggering the export of the transformed docs.
 *
 * Currently this gets used only by CSV export, though in principle it serves every export
 * with the abovementioned requirements, especially the second.
 *
 * @author Daniel de Oliveira
 */
export module ExportRunner {

    export const BASE_EXCLUSION = ['Operation', 'Project', 'Image', 'Drawing', 'Photo'];
    const ADD_EXCLUSION = ['Place', 'Survey', 'Trench', 'Building'];


    /**
     * @param find
     * @param selectedOperationId
     * @param selectedType
     * @param relations
     * @param getIdentifierForId
     * @param performExport
     */
    export async function performExport(find: Find,
                                        selectedOperationId: string|undefined,
                                        selectedType: IdaiType,
                                        relations: string[],
                                        getIdentifierForId: GetIdentifierForId,
                                        performExport: PerformExport) {

        const rewriteIdentifiers_ = rewriteIdentifiers(getIdentifierForId);

        const fetchDocs = async (selectedOperationId: string) => {

            const docs = await fetchDocuments(find, selectedOperationId, selectedType);
            return asyncMap(rewriteIdentifiers_)(docs)
        };

        try {
            await performExport(
                selectedOperationId
                    ? (await fetchDocs(selectedOperationId)).map(to('resource'))
                    : [],
                selectedType,
                relations);

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
        for (let resourceType of resourceTypes) {
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
     */
    async function fetchDocuments(find: Find,
                                  selectedOperationId: string,
                                  selectedType: IdaiType): Promise<Array<FieldDocument>> {

        try {

            const query = getQuery(selectedType.name, selectedOperationId);
            return (await find(query)).documents as Array<FieldDocument>;

        } catch (msgWithParams) {
            console.error(msgWithParams);
            return [];
        }
    }


    function rewriteIdentifiers(getIdentifierForId: GetIdentifierForId) {

        return async (document: FieldDocument): Promise<FieldDocument> => {

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