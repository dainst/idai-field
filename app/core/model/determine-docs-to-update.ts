import {on, tripleEqual, jsonClone, isNot, includedIn, flow, keys,
    forEach, map, lookup, pairWith, filter, cond} from 'tsfun';
import {Document, Resource, relationsEquivalent, Relations} from 'idai-components-2';
import {HIERARCHICAL_RELATIONS} from './relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import {Name} from '../constants';


/**
 * Determines which targetDocuments need their relations updated, based
 * on the relations seen in <i>document</i> alone. Relations in targetDocuments,
 * which correspond to other documents, are left as they are.
 *
 * @param document expected that relations is an object consisting only of proper relation names
 * @param targetDocuments
 * @param inverseRelationsMap
 * @param setInverses if <b>false</b>, relations of <i>targetDocuments</i>
 *   which point to <i>document</i>, get only removed, but not (re-)created
 *
 * @returns a selection with of the targetDocuments which
 *   got an update in their relations.
 *   Note that targetDocuments relations get modified <b>in place</b>.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function determineDocsToUpdate(document: Document,
                                      targetDocuments: Array<Document>,
                                      inverseRelationsMap: {[_: string]: string},
                                      setInverses: boolean = true): Array<Document> {

    const cloneOfTargetDocuments = jsonClone(targetDocuments);

    for (let targetDocument of targetDocuments) {

        pruneInverseRelations(
            document.resource.id,
            targetDocument.resource.relations,
            setInverses);

        if (setInverses) setInverseRelations(document, targetDocument, inverseRelationsMap);
    }

    return compare(targetDocuments, cloneOfTargetDocuments);
}


const notUnidirectional = isNot(includedIn([LIES_WITHIN, RECORDED_IN]));


function pruneInverseRelations(resourceId: string,
                               relations: Relations,
                               keepAllNoInverseRelations: boolean) {

    flow(
        keys(relations),
        filter(cond(keepAllNoInverseRelations, notUnidirectional)),
        forEach(removeRelation(resourceId, relations)));
}


function setInverseRelations(document: Document, targetDocument: Document,
                             inverseRelationsMap: {[_: string]: string}) {

    flow(
        keys(document.resource.relations),
        filter(notUnidirectional),
        map(pairWith(lookup(inverseRelationsMap))),
        forEach(setInverseRelation(document.resource, targetDocument.resource)));
}


function setInverseRelation(resource: Resource,
                            target: Resource) {

    return ([relation, inverse]: [Name, Name|undefined]) => {

        if (!inverse) return;
        resource.relations[relation]
            .filter(tripleEqual(target.id)) // match only the one targetDocument
            .forEach(() => {
                if (!target.relations[inverse]) target.relations[inverse] = [];
                const index = target.relations[inverse].indexOf(resource.id);
                if (index !== -1) target.relations[inverse].splice(index, 1);
                target.relations[inverse].push(resource.id);
            });
    }
}


function compare(targetDocuments: Array<Document>,
                 copyOfTargetDocuments: Array<Document>): Array<Document> {

    return targetDocuments.reduce((acc: any, targetDoc: any, i: number) =>
            !relationsEqualInDocuments(targetDoc, copyOfTargetDocuments[i])
                ? acc.concat(targetDoc)
                : acc
        , []);
}


function removeRelation(resourceId: string, relations: any) {

    return (relation: string): boolean => {

        const index = relations[relation].indexOf(resourceId);
        if (index === -1) return false;

        relations[relation].splice(index, 1);
        if (relations[relation].length === 0) delete relations[relation];

        return true;
    };
}


function relationsEqualInDocuments(documentA: Document, documentB: Document): boolean {

    return on('resource.relations', relationsEquivalent)(documentA)(documentB);
}