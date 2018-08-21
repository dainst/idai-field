import {Document, ProjectConfiguration, relationsEquivalent} from 'idai-components-2';
import {arrayEquivalent, isNot, objectEqualBy, on, tripleEqual} from 'tsfun';

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
     * @param projectConfiguration
     * @param document
     * @param targetDocuments
     * @param shouldSetInverseRelations if <b>false</b>, relations of <i>targetDocuments</i>
     *   which point to <i>document</i>, get only removed, but not (re-)created
     *
     * @returns a selection with of the targetDocuments which
     *   got an update in their relations.
     *   Note that targetDocuments relations get modified <b>in place</b>.
     */
    export function determineDocsToUpdate(
        projectConfiguration: ProjectConfiguration,
        document: Document,
        targetDocuments: Array<Document>,
        shouldSetInverseRelations: boolean = true
    ): Array<Document> {

        const copyOfTargetDocuments = JSON.parse(JSON.stringify(targetDocuments));

        for (let targetDocument of targetDocuments) {

            pruneInverseRelations(
                projectConfiguration,
                document.resource.id,
                targetDocument,
                shouldSetInverseRelations);

            if (shouldSetInverseRelations) setInverseRelations(
                projectConfiguration, document, targetDocument);
        }

        return compare(targetDocuments, copyOfTargetDocuments);
    }


    function pruneInverseRelations(projectConfiguration: ProjectConfiguration,
                                   resourceId: string,
                                   targetDocument: Document,
                                   keepAllNoInverseRelations: boolean) {

        Object.keys(targetDocument.resource.relations)
            .filter(relation => projectConfiguration.isRelationProperty(relation))
            .filter(relation => (!(keepAllNoInverseRelations && relation === 'isRecordedIn')))
            .forEach(removeRelation(resourceId, targetDocument.resource.relations));
    }


    function setInverseRelations(projectConfiguration: ProjectConfiguration,
                                 document: Document,
                                 targetDocument: Document) {

        Object.keys(document.resource.relations)
            .filter(relation => projectConfiguration.isRelationProperty(relation))
            .filter(isNot(tripleEqual("isRecordedIn")) )
            .forEach(relation => setInverseRelation(document, targetDocument,
                    relation, projectConfiguration.getInverseRelations(relation)));
    }


    function setInverseRelation(document: Document,
                                targetDocument: Document,
                                relation: any,
                                inverse: any) {

        document.resource.relations[relation]
            .filter(id => id === targetDocument.resource.id) // match only the one targetDocument
            .forEach(() => {

                if (targetDocument.resource.relations[inverse] == undefined)
                    targetDocument.resource.relations[inverse as any] = [];

                const index = targetDocument.resource.relations[inverse].indexOf(document.resource.id as any);
                if (index != -1) {
                    targetDocument.resource.relations[inverse].splice(index, 1);
                }

                targetDocument.resource.relations[inverse].push(document.resource.id as any);
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
        if (index == -1) return false;

        relations[relation].splice(index, 1);
        if (relations[relation].length == 0) delete relations[relation];

        return true;
    }
}