import {Document} from 'idai-components-2';
import {ImportErrors} from './import-errors';
import {filter, flatMap, flow, isEmpty, isUndefinedOrEmpty, on, subtractBy, union} from 'tsfun';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';
import {clone} from '../../util/object-util';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {


    /**
     * Iterates over all relation (ex) of the given resources. Between import resources, it validates the relations.
     * Between import resources and db resources, it adds the inverses.
     *
     * @param documents If one of these references another from the import file, the validity of the relations gets checked
     *   for contradictory relations and missing inverses are added.
     * @param get
     * @param isRelationProperty
     * @param getInverseRelation
     * @param mergeMode
     *
     * @returns the target documents which should be updated. Only those fetched from the db are included. If a target document comes from
     *   the import file itself, <code>documents</code> gets modified in place accordingly.
     *
     * side-effects: if an inverse of one of documents is not set, it gets completed automatically.
     *   The document from documents then gets modified in place.
     *
     * @throws ImportErrors.*
     * @throws [EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws [NOT_INTERRELATED, sourceId, targetId]
     * @throws [EMPTY_RELATION, resourceId]
     */
    export async function completeInverseRelations(documents: Array<Document>,
                                                   get: (_: string) => Promise<Document>,
                                                   isRelationProperty: (_: string) => boolean,
                                                   getInverseRelation: (_: string) => string|undefined,
                                                   mergeMode: boolean = false): Promise<Array<Document>> {


        const documentsLookup: {[id: string]: Document} = documents
            .reduce((documentsMap: {[id: string]: Document}, document: Document) => {
                documentsMap[document.resource.id] = document;
                return documentsMap;
            }, {});

        for (let document of documents) {

            await setInverseRelationsForImportResource(
                document,
                documentsLookup,
                getInverseRelation,
                relationNamesExceptRecordedIn(document, isRelationProperty));
        }

        return await setInverseRelationsForDbResources(
            documents,
            documentsLookup,
            get,
            isRelationProperty,
            getInverseRelation,
            mergeMode);
    }


    async function setInverseRelationsForDbResources(documents: Array<Document>,
                                                     documentsLookup: {[id: string]: Document},
                                                     get: (_: string) => Promise<Document>,
                                                     isRelationProperty: (_: string) => boolean,
                                                     getInverseRelation: (_: string) => string|undefined,
                                                     mergeMode: boolean): Promise<Array<Document>> {

        let totalDocsToUpdate: Array<Document> = [];

        for (let document of documents) {

            const documentTargetDocs: Array<Document> = [];

            let targetIds = targetIdsReferingToObjects(document, documentsLookup, isRelationProperty);
            if (mergeMode) {
                let oldVersion;
                try {
                    oldVersion = await get(document.resource.id);
                } catch { throw "FATAL" } // TODO improve
                targetIds = union([targetIds, targetIdsReferingToObjects(oldVersion as any, documentsLookup, isRelationProperty)]);
            }
            for (let targetId of targetIds) documentTargetDocs.push(
                await getTargetDocument(targetId, totalDocsToUpdate, get));

            const documentTargetDocsToUpdate = ConnectedDocsResolution.determineDocsToUpdate(
                document, documentTargetDocs, isRelationProperty, getInverseRelation);

            totalDocsToUpdate = addOrOverwrite(totalDocsToUpdate)(documentTargetDocsToUpdate);
        }

        return totalDocsToUpdate;
    }


    function addOrOverwrite(to: Array<Document>) {

        return (from: Array<Document>) => {

            const result = subtractBy(on('resource.id'))(from)(to);
            from.forEach(doc => result.push(doc));
            return result;
        }
    }


    async function getTargetDocument(targetId: string, totalDocsToUpdate: Array<Document>, get: Function): Promise<Document> {

        let targetDocument = totalDocsToUpdate
            .find(document => document.resource.id === targetId);
        if (!targetDocument) try {
            targetDocument = clone(await get(targetId));
        } catch {
            throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId]
        }
        return targetDocument as Document;
    }


    function relationNamesExceptRecordedIn(document: Document, isRelationProperty: Function) {

        return Object
            .keys(document.resource.relations)
            .filter(relationName => relationName !== 'isRecordedIn')
            .filter(relationName => isRelationProperty(relationName))
    }


    function targetIdsReferingToObjects(document: Document, documentsLookup: any, isRelationProperty: Function, ) {

        return flow(relationNamesExceptRecordedIn(document, isRelationProperty),
            flatMap(relationName => document.resource.relations[relationName]),
            filter((targetId: string) => !documentsLookup[targetId]));
    }


    async function setInverseRelationsForImportResource(document: Document,
                                                        documentsLookup: {[id: string]: Document},
                                                        getInverseRelation: (_: string) => string|undefined,
                                                        relationNamesExceptIsRecordedIn: string[]): Promise<void> {


        for (let relationName of relationNamesExceptIsRecordedIn) {
            if (isEmpty(document.resource.relations[relationName])) throw [ImportErrors.EMPTY_RELATION, document.resource.identifier];

            const inverseRelationName = getInverseRelation(relationName);
            if (!inverseRelationName) continue;

            if (!isUndefinedOrEmpty(document.resource.relations[inverseRelationName])) {
                const u  = union([document.resource.relations[relationName], document.resource.relations[inverseRelationName]]);
                if (u.length > 0) {
                    throw [ImportErrors.BAD_INTERRELATION,
                        document.resource.identifier,
                        documentsLookup[u[0]].resource.identifier];
                }
            }

            for (let targetId of document.resource.relations[relationName]) {
                let targetDocument = documentsLookup[targetId];
                if (!targetDocument) continue;

                if (isUndefinedOrEmpty(targetDocument.resource.relations[inverseRelationName])) {
                    targetDocument.resource.relations[inverseRelationName] = [];
                }
                if (!targetDocument.resource.relations[inverseRelationName].includes(document.resource.id)) {
                    targetDocument.resource.relations[inverseRelationName].push(document.resource.id);
                }
            }
        }
    }
}
