import {on, jsonClone, isNot, includedIn, flow, keys, isnt, append, isDefined,
    forEach, map, lookup, pairWith, filter, cond, copy, get} from 'tsfun';
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

    const cloneOfTargetDocuments = jsonClone(targetDocuments); // TODO review; at the very least this should be done with clone instead of jsonClone

    for (let targetDocument of targetDocuments) {

        targetDocument.resource.relations =
            pruneInverseRelations(
                targetDocument.resource.relations,
                document.resource.id,
                setInverses);

        if (setInverses) {
            setInverseRelations(
                targetDocument.resource,
                document.resource,
                inverseRelationsMap);
        }
    }

    return compare(targetDocuments, cloneOfTargetDocuments);
}


const notUnidirectional = isNot(includedIn([LIES_WITHIN, RECORDED_IN]));


/**
 * { a: ['3'], b: ['3', '7'] }
 * resourceId: '3'
 * ->
 * { b: ['3'] }
 */
function pruneInverseRelations(relations: Relations,
                               resourceId: string,
                               keepAllNoInverseRelations: boolean) {

    const newRelations = copy(relations);

    keys(relations)
        .filter(cond(keepAllNoInverseRelations, notUnidirectional))
        .map(pairWith(lookup(relations)))
        .forEach(([name, content]: [string, string[]]) => {
            newRelations[name] = content.filter(isnt(resourceId));
            if (newRelations[name].length === 0) delete newRelations[name];
        });

    return newRelations;
}


const removeUnidirectionalRelations = filter(notUnidirectional);

const inverseIsDefined = on('[1]', isDefined);


function setInverseRelations(target: Resource,
                             resource: Resource,
                             inverseRelationsMap: {[_: string]: string}) {

    flow(
        keys(resource.relations),
        removeUnidirectionalRelations,
        map(pairWith(lookup(inverseRelationsMap))),
        filter(inverseIsDefined),
        forEach(setInverseRelation(target, resource)));
}


/**
 * target.relations = {}
 * resource = { id: '1', relations { a: ['2'] } }
 * relation = 'a', inverse = 'a_inv'
 * ->
 * target.relations = { a: ['1'] }
 *
 * Modifies target in place!
 */
function setInverseRelation(target: Resource, resource: Resource) {

    return ([relation, inverse]: [Name, Name]) => {

        if (resource.relations[relation].includes(target.id)) {

            target.relations[inverse] =
                flow(
                    target.relations,
                    get(inverse, []),
                    filter(isnt(resource.id)),
                    append(resource.id));
        }
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


function relationsEqualInDocuments(documentA: Document, documentB: Document): boolean {

    return on('resource.relations', relationsEquivalent)(documentA)(documentB);
}