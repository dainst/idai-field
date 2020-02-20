import {on, Predicate, flow, keys, isnt, append, isDefined, compose,
    forEach, map, lookup, pairWith, filter, cond, copy, get, zip, Pair} from 'tsfun';
import {Document, Resource, relationsEquivalent, Relations} from 'idai-components-2';
import {Name} from '../constants';
import {clone} from '../util/object-util';


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
 *   - Modified in place! -
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function determineDocsToUpdate(document: Document,
                                      targetDocuments: Array<Document>,
                                      inverseRelationsMap: {[_: string]: string}, // TODO should be string|undefined
                                      setInverses: boolean = true): Array<Document> {

    const cloneOfTargetDocuments = clone(targetDocuments);

    const getInverse = lookup(inverseRelationsMap);
    const hasInverseRelation = compose(getInverse, isDefined);

    for (let targetDocument of targetDocuments) {

        targetDocument.resource.relations =
            pruneInverseRelations(
                targetDocument.resource.relations,
                document.resource.id,
                setInverses,
                hasInverseRelation);

        if (setInverses) {
            setInverseRelations(
                targetDocument.resource,
                document.resource,
                getInverse,
                hasInverseRelation);
        }
    }

    return determineChangedDocs(targetDocuments, cloneOfTargetDocuments);
}


/**
 * { a: ['3'], b: ['3', '7'] }
 * resourceId: '3'
 * ->
 * { b: ['3'] }
 */
function pruneInverseRelations(relations: Relations,
                               resourceId: string,
                               setInverses: boolean,
                               hasInverseRelation: Predicate<String>) {

    const newRelations = copy(relations);

    keys(relations)
        .filter(cond(setInverses, hasInverseRelation)) // TODO review
        .map(pairWith(lookup(relations)))
        .forEach(([name, content]: [string, string[]]) => {
            newRelations[name] = content.filter(isnt(resourceId));
            if (newRelations[name].length === 0) delete newRelations[name];
        });

    return newRelations;
}


function setInverseRelations(target: Resource,
                             resource: Resource,
                             getInverse: (_: string) => string|undefined,
                             hasInverseRelation: Predicate<string>) {

    flow(
        keys(resource.relations),
        filter(hasInverseRelation),
        map(pairWith(getInverse)),
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


function determineChangedDocs(targetDocuments: Array<Document>,
                              cloneOfTargetDocuments: Array<Document>): Array<Document> {

    return zip(targetDocuments)(cloneOfTargetDocuments).reduce(changedDocsReducer, []);
}


function changedDocsReducer(changedDocs: Array<Document>, [targetDoc, cloneOfTargetDoc]: Pair<Document, Document>) {

    return !documentsRelationsEquivalent(targetDoc)(cloneOfTargetDoc)
        ? changedDocs.concat(targetDoc)
        : changedDocs;
}


const documentsRelationsEquivalent = on('resource.relations', relationsEquivalent); // TODO review
