import { Lookup, ResourceId } from 'idai-field-core';
import { Document } from 'idai-field-core';
import { includedIn, is, isNot, keysValues, on } from 'tsfun';
import { InverseRelationsMap } from '../../../configuration/inverse-relations-map';
import { updateRelations } from '../../../model/update-relations';
import { AssertIsAllowedRelationDomainType } from '../types';
import { assertInSameOperationWith, unionOfDocuments } from '../utils';


/**
 * @param importDocuments
 *   are of resources already in the db and referenced by the current version of the importDocument,
 *   and the second list's ids are resources already in the db and referenced by the version
 *   to be updated of importDocument, where only ids that are not in the first list are listed.
 * @param targetsLookup
 * @param inverseRelationsMap
 * @param assertIsAllowedRelationDomainCategory
 * @param unidirectionalRelations names of relations for which not inverses get set in the db.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function setInverseRelationsForDbResources(
        importDocuments: Array<Document>,
        targetsLookup: Lookup<[ResourceId[], Array<Document>]>,
        inverseRelationsMap: InverseRelationsMap,
        assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType,
        unidirectionalRelations: string[]): Array<Document> {

    function getDocumentTargetDocsToUpdate(document: Document) {

        const [currentTargetIds, targetDocuments] = targetsLookup[document.resource.id];

        assertCategoryIsInRange(document, makeIdCategoryMap(currentTargetIds, targetDocuments), assertIsAllowedRelationDomainCategory);
        const copyOfTargetDocuments = getRidOfUnnecessaryTargetDocs(document, targetDocuments, unidirectionalRelations);

        updateRelations(document, copyOfTargetDocuments, inverseRelationsMap)
            .forEach(assertInSameOperationWith(document));

        return copyOfTargetDocuments;
    }

    return reduceToDBDocumentsToBeUpdated(getDocumentTargetDocsToUpdate)(importDocuments);
}


function reduceToDBDocumentsToBeUpdated(
        getDocumentTargetDocsToUpdate: (document: Document) => Array<Document>) {

    return (documents: Array<Document>) => documents.reduce(
        (totalDocsToUpdate: Array<Document>, document: Document) => {

            return unionOfDocuments([
                totalDocsToUpdate,
                getDocumentTargetDocsToUpdate(document)]);

        },
        []);
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



function makeIdCategoryMap(targetIds: ResourceId[], documentTargetDocuments: Array<Document>) {

    return targetIds.reduce((acc, targetId) => {
        const lookedUp = documentTargetDocuments.find(on(['resource','id'], is(targetId)));
        if (!lookedUp) return acc;
        acc[targetId] = lookedUp.resource.category;
        return acc;
    }, {} as {[resourceId: string]: string /* category */});
}


function assertCategoryIsInRange(document: Document, idCategoryMap: any,
                                 assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType) {

    keysValues(document.resource.relations).forEach(([relationName, relationTargets]) => {
        for (let relationTarget of relationTargets) {
            const targetCategory = idCategoryMap[relationTarget];
            if (!targetCategory) continue;
            assertIsAllowedRelationDomainCategory(
                document.resource.category, targetCategory, relationName, document.resource.identifier
            );
        }
    })
}
