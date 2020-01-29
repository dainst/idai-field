import {is, on, union, isNot, includedIn, keysAndValues} from 'tsfun';
import {asyncMap, asyncReduce} from 'tsfun-extra';
import {Document} from 'idai-components-2';
import {ImportErrors as E} from '../import-errors';
import {clone} from '../../../util/object-util';
import {ResourceId} from '../../../constants';
import {assertInSameOperationWith, unionOfDocuments} from '../utils';
import {AssertIsAllowedRelationDomainType} from '../types';
import {determineDocsToUpdate} from '../../../model/determine-docs-to-update';


/**
 * @param importDocuments
 * @param getTargetIds a pair of id lists, where the first list's ids
 *   are of resources already in the db and referenced by the current version of the importDocument,
 *   and the second list's ids are resources already in the db and referenced by the version
 *   to be updated of importDocument, where only ids that are not in the first list are listed.
 * @param get
 * @param inverseRelationsMap
 * @param assertIsAllowedRelationDomainType
 * @param unidirectionalRelations names of relations for which not inverses get set in the db.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export async function setInverseRelationsForDbResources(
        importDocuments: Array<Document>,
        getTargetIds: (document: Document) => Promise<[ResourceId[], ResourceId[]]>,
        get: (_: string) => Promise<Document>,
        inverseRelationsMap: {[_: string]: string},
        assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType,
        unidirectionalRelations: string[]): Promise<Array<Document>> {

    let allFetchedDocuments: Array<Document> = []; // store already fetched documents

    async function getDocumentTargetDocsToUpdate(document: Document) {

        const allTargetIds = await getTargetIds(document);
        const currentAndOldTargetIds = union(allTargetIds);
        const [currentTargetIds, _] = allTargetIds;

        const targetDocuments = await asyncMap(getTargetDocument(allFetchedDocuments, get))(currentAndOldTargetIds);
        allFetchedDocuments = unionOfDocuments([allFetchedDocuments, targetDocuments]);

        assertTypeIsInRange(document, makeIdTypeMap(currentTargetIds, targetDocuments), assertIsAllowedRelationDomainType);
        const copyOfTargetDocuments = getRidOfUnnecessaryTargetDocs(document, targetDocuments, unidirectionalRelations);

        determineDocsToUpdate(document, copyOfTargetDocuments, inverseRelationsMap)
            .forEach(assertInSameOperationWith(document));

        return copyOfTargetDocuments;
    }

    return await reduceToDBDocumentsToBeUpdated(getDocumentTargetDocsToUpdate)(importDocuments);
}


function reduceToDBDocumentsToBeUpdated(
        getDocumentTargetDocsToUpdate: (document: Document) => Promise<Array<Document>>) {

    return asyncReduce(
        async (totalDocsToUpdate: Array<Document>, document: Document) => {

            return unionOfDocuments([
                totalDocsToUpdate,
                await getDocumentTargetDocsToUpdate(document)]);

        }, []);
}


/**
 * If none of the target documents references the document here,
 * and the document here does not reference a targetDocument with a bi-directional relation,
 * there will be no update for that targetDocument
 */
function getRidOfUnnecessaryTargetDocs(document: Document, targetDocuments: Array<Document>,
                                       unidirectionalRelations: string[]) {

    return targetDocuments.filter(targetDocument => {
        for (let k of Object
            .keys(document.resource.relations)
            .filter(isNot(includedIn(unidirectionalRelations)))) {

            if (document.resource.relations[k].includes(targetDocument.resource.id)) return true;
        }
        for (let k of Object.keys(targetDocument.resource.relations)) {
            if (targetDocument.resource.relations[k].includes(document.resource.id)) return true;
        }
        return false;
    });
}



function makeIdTypeMap(targetIds: ResourceId[], documentTargetDocuments: Array<Document>) {

    return targetIds.reduce((acc, targetId) => {
        const lookedUp = documentTargetDocuments.find(on('resource.id', is(targetId)));
        if (!lookedUp) return acc;
        acc[targetId] = lookedUp.resource.type;
        return acc;
    }, {} as {[resourceId: string]: string /* typeName */});
}


function assertTypeIsInRange(document: Document,
                             idTypeMap: any,
                             assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType) {

    keysAndValues(document.resource.relations)
        .forEach(([relationName, relationTargets]: [string, string[]]) => {
            for (let relationTarget of relationTargets) {
                const targetType = idTypeMap[relationTarget];
                if (!targetType) continue;
                assertIsAllowedRelationDomainType(
                    document.resource.type, targetType, relationName, document.resource.identifier
                );
            }
        })
}


function getTargetDocument(documents: Array<Document>, get: Function) {

    return async (targetId: string): Promise<Document> => {

        let targetDocument = documents
            .find(on('resource.id', is(targetId)));
        if (!targetDocument) try {
            targetDocument = clone(await get(targetId));
        } catch {
            throw [E.EXEC_MISSING_RELATION_TARGET, targetId];
        }
        return targetDocument as Document;
    }
}
