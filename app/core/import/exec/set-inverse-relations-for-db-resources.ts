import {Document} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {is, on, union, isnt} from 'tsfun';
import {subtractBy} from 'tsfun-core';
import {asyncMap} from 'tsfun-extra';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';
import {clone} from '../../util/object-util';
import {ResourceId} from '../../../c';
import {keysAndValues} from 'tsfun/src/objectmap';
import {assertInSameOperationWith} from './utils';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;



/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export async function setInverseRelationsForDbResources(importDocuments: Array<Document>,
                                                        getTargetIds: Function, // TODO improve
                                                        get: (_: string) => Promise<Document>,
                                                        getInverseRelation: (_: string) => string|undefined,
                                                        assertIsAllowedRelationDomainType: Function, // TODO improve typing
): Promise<Array<Document>> {


    async function getDocumentTargetDocsToUpdate(document: Document) {

        const allTargetIds = await getTargetIds(document);
        const currentAndOldTargetIds = union(allTargetIds);
        const [currentTargetIds, _] = allTargetIds;

        const targetDocuments = await asyncMap<any>(getTargetDocument(totalDocsToUpdate, get))(currentAndOldTargetIds);
        assertTypeIsInRange(document, makeIdTypeMap(currentTargetIds, targetDocuments), assertIsAllowedRelationDomainType);

        const copyOfTargetDocuments = getRidOfUnnecessaryTargetDocs(document, targetDocuments);

        ConnectedDocsResolution
            .determineDocsToUpdate(document, copyOfTargetDocuments, getInverseRelation)
            .forEach(assertInSameOperationWith(document));

        return copyOfTargetDocuments;
    }

    let totalDocsToUpdate: Array<Document> = [];
    for (let document of importDocuments) {
        totalDocsToUpdate = addOrOverwrite(totalDocsToUpdate, await getDocumentTargetDocsToUpdate(document));
    }
    return totalDocsToUpdate;
}


/**
 * If none of the target documents references the document here,
 * and the document here does not reference a targetDocument with a bi-directional relation,
 * there will be no update for that targetDocument
 */
function getRidOfUnnecessaryTargetDocs(document: Document, targetDocuments: Array<Document>) {

    return targetDocuments.filter(targetDocument => {
        for (let k of Object.keys(document.resource.relations).filter(isnt(LIES_WITHIN)).filter(isnt(RECORDED_IN))) { // TODO make interface UNIDIRECTIONAL_RELATIONS
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


function addOrOverwrite(to: Array<Document>, from: Array<Document>) {

    const difference = subtractBy(on('resource.id'))(from)(to);
    return difference.concat(from);
}


function assertTypeIsInRange(document: Document,
                             idTypeMap: any,
                             assertIsAllowedRelationDomainType: Function /* TODO */) {

    keysAndValues(document.resource.relations)
        .forEach(([relationName, relationTargets]: [string, string[]]) => {
            for (let relationTarget of relationTargets) {
                const targetType = idTypeMap[relationTarget];
                if (!targetType) continue;
                assertIsAllowedRelationDomainType(document.resource.type, targetType, relationName, document.resource.identifier);
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
            throw [E.EXEC_MISSING_RELATION_TARGET, targetId]
        }
        return targetDocument as Document;
    }
}
