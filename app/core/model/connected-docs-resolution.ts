import {on, tripleEqual, jsonClone, isnt, flow, keys, remove, forEach} from 'tsfun';
import {Document, relationsEquivalent} from 'idai-components-2';
import {HIERARCHICAL_RELATIONS} from './relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConnectedDocsResolution {


    /**
     * Determines which targetDocuments need their relations updated, based
     * on the relations seen in <i>document</i> alone. Relations in targetDocuments,
     * which correspond to other documents, are left as they are.
     *
     * @param document expected that relations is an object consisting only of proper relation names
     * @param targetDocuments
     * @param getInverseRelation
     * @param setInverses if <b>false</b>, relations of <i>targetDocuments</i>
     *   which point to <i>document</i>, get only removed, but not (re-)created
     *
     * @returns a selection with of the targetDocuments which
     *   got an update in their relations.
     *   Note that targetDocuments relations get modified <b>in place</b>.
     */
    export function determineDocsToUpdate(document: Document,
                                          targetDocuments: Array<Document>,
                                          getInverseRelation: (_: string) => string|undefined,
                                          setInverses: boolean = true): Array<Document> {

        const cloneOfTargetDocuments = jsonClone(targetDocuments);

        for (let targetDocument of targetDocuments) {

            pruneInverseRelations(
                document.resource.id,
                targetDocument,
                setInverses);

            if (setInverses) setInverseRelations(document, targetDocument, getInverseRelation);
        }

        return compare(targetDocuments, cloneOfTargetDocuments);
    }


    function pruneInverseRelations(resourceId: string,
                                   targetDocument: Document,
                                   keepAllNoInverseRelations: boolean) {

        flow(targetDocument.resource.relations,
            keys,
            remove(relation => keepAllNoInverseRelations && (relation === RECORDED_IN || relation === LIES_WITHIN)),
            forEach(removeRelation(resourceId, targetDocument.resource.relations)));
    }


    function setInverseRelations(document: Document, targetDocument: Document,
                                 getInverseRelation: (_: string) => string|undefined) {

        Object.keys(document.resource.relations)
            .filter(isnt(RECORDED_IN))
            .filter(isnt(LIES_WITHIN))
            .forEach(relation => setInverseRelation(document, targetDocument,
                    relation, getInverseRelation(relation)));
    }


    function setInverseRelation(document: Document,
                                targetDoc: Document,
                                relation: string,
                                inverse: string|undefined) {


        if (!inverse) return;
        document.resource.relations[relation]
            .filter(tripleEqual(targetDoc.resource.id)) // match only the one targetDocument
            .forEach(() => {
                if (!targetDoc.resource.relations[inverse]) targetDoc.resource.relations[inverse] = [];
                const index = targetDoc.resource.relations[inverse].indexOf(document.resource.id);
                if (index !== -1) targetDoc.resource.relations[inverse].splice(index, 1);
                targetDoc.resource.relations[inverse].push(document.resource.id);
            });
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


    const removeRelation = (resourceId: string, relations: any) => (relation: string): boolean => {

        const index = relations[relation].indexOf(resourceId);
        if (index === -1) return false;

        relations[relation].splice(index, 1);
        if (relations[relation].length === 0) delete relations[relation];

        return true;
    }
}