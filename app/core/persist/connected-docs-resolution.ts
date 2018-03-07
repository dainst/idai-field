import {Document, ProjectConfiguration} from 'idai-components-2/core';

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
     * @param setInverseRelations if <b>false</b>, relations of <i>targetDocuments</i>
     *   which point to <i>document</i>, get only removed, but not (re-)created
     *
     * @returns a selection with copies of the targetDocuments which
     *   got an update in their relations
     */
    export function determineDocsToUpdate(
        projectConfiguration: ProjectConfiguration,
        document: Document,
        targetDocuments: Array<Document>,
        shouldSetInverseRelations: boolean = true): Array<Document> {

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


    function pruneInverseRelations(
        projectConfiguration: ProjectConfiguration,
        resourceId: string,
        targetDocument: Document,
        keepAllNoInverseRelations: boolean) {

        Object.keys(targetDocument.resource.relations)
            .filter(relation => projectConfiguration.isRelationProperty(relation))
            .filter(relation => (!(keepAllNoInverseRelations && relation == 'isRecordedIn')))
            .forEach(relation =>
                removeRelation(
                    resourceId, targetDocument.resource.relations, relation)
            );
    }


    function setInverseRelations(
        projectConfiguration: ProjectConfiguration,
        document: Document,
        targetDocument: Document) {

        Object.keys(document.resource.relations)
            .filter(relation => projectConfiguration.isRelationProperty(relation))
            .filter(relation => relation != "isRecordedIn")
            .forEach(relation => {

                const inverse = projectConfiguration.getInverseRelations(relation);

                document.resource.relations[relation]
                    .filter(id => id == targetDocument.resource.id) // match only the one targetDocument
                    .forEach(() => {
                        if (targetDocument.resource.relations[inverse as any] == undefined)
                            targetDocument.resource.relations[inverse as any] = [];

                        const index = targetDocument.resource.relations[inverse as any].indexOf(document.resource.id as any);
                        if (index != -1) {
                            targetDocument.resource.relations[inverse as any].splice(index, 1);
                        }

                        targetDocument.resource.relations[inverse as any].push(document.resource.id as any);
                    });
            });
    }


    function compare(targetDocuments: Array<Document>, copyOfTargetDocuments: Array<Document>): Array<Document> {

        const docsToUpdate = [] as any;

        for (let i in targetDocuments) {
            let same = true;

            if (Object.keys(targetDocuments[i].resource.relations).sort().toString()
                == Object.keys(copyOfTargetDocuments[i].resource.relations).sort().toString()) {

                for (let relation in copyOfTargetDocuments[i].resource.relations) {
                    const orig = targetDocuments[i].resource.relations[relation].sort().toString();
                    const copy = copyOfTargetDocuments[i].resource.relations[relation].sort().toString();
                    if (orig != copy) same = false;
                }
            } else {
                same = false;
            }

            if (!same) docsToUpdate.push(targetDocuments[i] as never);
        }

        return docsToUpdate;
    }


    function removeRelation(resourceId: string, relations: any, relation: string): boolean {

        const index = relations[relation].indexOf(resourceId);
        if (index == -1) return false;

        relations[relation].splice(index, 1);
        if (relations[relation].length == 0) delete relations[relation];

        return true;
    }
}