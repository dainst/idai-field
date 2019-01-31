import {on, tripleEqual, jsonClone, isnt} from 'tsfun';
import {Document, relationsEquivalent} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConnectedDocsResolution {

    const LIES_WITHIN = 'liesWithin';
    const RECORDED_IN = 'isRecordedIn';


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
    export function determineDocsToUpdate(document: Document, targetDocuments: Array<Document>,
                                          getInverseRelation: (_: string) => string|undefined,
                                          setInverses: boolean = true): Array<Document> {

        const copyOfTargetDocuments = jsonClone(targetDocuments);

        for (let targetDocument of targetDocuments) {

            pruneInverseRelations(
                document.resource.id,
                targetDocument,
                setInverses);

            if (setInverses) setInverseRelations(document, targetDocument, getInverseRelation);
        }

        return compare(targetDocuments, copyOfTargetDocuments);
    }


    function pruneInverseRelations(resourceId: string,
                                   targetDocument: Document,
                                   keepAllNoInverseRelations: boolean) {

        Object.keys(targetDocument.resource.relations)
            .filter(relation => (!(keepAllNoInverseRelations && (relation === RECORDED_IN || relation === LIES_WITHIN))))
            .forEach(removeRelation(resourceId, targetDocument.resource.relations));
    }


    function setInverseRelations(document: Document, targetDocument: Document,
                                 getInverseRelation: (_: string) => string|undefined) {

        Object.keys(document.resource.relations)
            .filter(isnt(RECORDED_IN))
            .filter(isnt(LIES_WITHIN))
            .forEach(relation => setInverseRelation(document, targetDocument,
                    relation, getInverseRelation(relation)));
    }


    function setInverseRelation(document: Document, targetDoc: Document, relation: string,
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