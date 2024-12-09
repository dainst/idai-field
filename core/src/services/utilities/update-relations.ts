import { append, compose, cond, filter, flow, forEach, isDefined, isEmpty, isnt, lookup, map, on,
    Pair, pairWith, Predicate, remove, to, update, values, zip, reduce, assoc, keys } from 'tsfun';
import { Document } from '../../model/document/document';
import { Resource } from '../../model/document/resource';
import { Name } from '../../tools';
import { Relation } from '../../model/configuration/relation';


/**
 * Determines which targetDocuments need their relations updated, based
 * on the relations seen in <i>document</i> alone, and performs the updates.
 * Relations in targetDocuments, which correspond to other documents, are left as they are.
 *
 * @param document expected that relations is an object consisting only of proper relation names
 * @param targetDocuments
 * @param inverseRelationsMap
 * @param setInverses if false, relations of targetDocuments
 *   which point to document, get only removed, but not (re-)created
 *
 * @returns All targetDocuments that got an update in their relations.
 *   - Modified in place! -
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function updateRelations(document: Document, 
                                targetDocuments: Array<Document>,
                                inverseRelationsMap: Relation.InverseRelationsMap,
                                setInverses: boolean = true): Array<Document> {

    const cloneOfTargetDocuments = targetDocuments.map(Document.clone);

    const getInverse = lookup(inverseRelationsMap);
    const hasInverseRelation = compose(getInverse, isDefined);

    for (let targetDocument of targetDocuments) {
        targetDocument.resource.relations =
            pruneInverseRelations(
                targetDocument.resource.relations,
                document.resource.id,
                setInverses,
                hasInverseRelation
            );

        if (setInverses) {
            setInverseRelations(
                targetDocument.resource,
                document.resource,
                getInverse,
                hasInverseRelation
            );
        }
    }

    return determineChangedDocs(targetDocuments, cloneOfTargetDocuments);
}


/**
 * { a: ['3'], b: ['3', '7'] }
 * resourceId: '3'
 * ->
 * { b: ['7'] }
 */
function pruneInverseRelations(relations: Resource.Relations,
                               resourceId: string,
                               setInverses: boolean,
                               hasInverseRelation: Predicate<String>) {

    return flow(
        keys(relations),
        filter(cond(setInverses, hasInverseRelation, true)),
        map(pairWith(lookup(relations))),
        map(update(1, filter(isnt(resourceId)))),
        reduce((relations, [key, value]) => assoc(key, value, relations), relations),
        remove(isEmpty)
    );
}


function setInverseRelations(target: Resource, 
                             resource: Resource,
                             getInverse: (_: string) => string|undefined,
                             hasInverseRelation: Predicate<string>) {

    flow(
        keys(resource.relations),
        filter(hasInverseRelation),
        map(pairWith(getInverse)),
        values,
        forEach(setInverseRelation(target, resource))
    );
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
                    to(inverse, []),
                    filter(isnt(resource.id)),
                    append(resource.id)
                );
        }
    }
}


function determineChangedDocs(targetDocuments: Array<Document>,
                              cloneOfTargetDocuments: Array<Document>): Array<Document> {

    return zip(targetDocuments, cloneOfTargetDocuments).reduce(changedDocsReducer, []);
}


function changedDocsReducer(changedDocs: Array<Document>, [targetDoc, cloneOfTargetDoc]: Pair<Document, Document>) {

    return changedDocs.concat(
        !documentsRelationsEquivalent(targetDoc as any /* TODO review typings */)(cloneOfTargetDoc as any)
            ? targetDoc
            : []
    );
}


const documentsRelationsEquivalent = on(Document.RESOURCE, Resource.relationsEquivalent);
