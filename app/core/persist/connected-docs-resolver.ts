import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConnectedDocsResolver {

    constructor(private projectConfiguration: ProjectConfiguration) {}


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
    public determineDocsToUpdate(document: Document,
                                 targetDocuments: Array<Document>,
                                 setInverseRelations: boolean = true): Array<Document> {

        const copyOfTargetDocuments = JSON.parse(JSON.stringify(targetDocuments));

        for (let targetDocument of targetDocuments) {
            this.pruneInverseRelations(document.resource.id as any, targetDocument, setInverseRelations);
            if (setInverseRelations) this.setInverseRelations(document, targetDocument);
        }

        return ConnectedDocsResolver.compare(targetDocuments, copyOfTargetDocuments);
    }


    private pruneInverseRelations(resourceId: string,
                                  targetDocument: Document,
                                  keepAllNoInverseRelations: boolean) {

        Object.keys(targetDocument.resource.relations)
            .filter(relation => this.projectConfiguration.isRelationProperty(relation))
            .filter(relation => (!(keepAllNoInverseRelations && relation == 'isRecordedIn')))
            .forEach(relation =>
                ConnectedDocsResolver.removeRelation(
                    resourceId, targetDocument.resource.relations, relation)
            );
    }


    private setInverseRelations(document: Document, targetDocument: Document) {

        Object.keys(document.resource.relations)
            .filter(relation => this.projectConfiguration.isRelationProperty(relation))
            .filter(relation => relation != "isRecordedIn")
            .forEach(relation => {

                const inverse = this.projectConfiguration.getInverseRelations(relation);

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


    private static compare(targetDocuments: Array<Document>, copyOfTargetDocuments: Array<Document>): Array<Document> {

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


    private static removeRelation(resourceId: string, relations: any, relation: string): boolean {

        const index = relations[relation].indexOf(resourceId);
        if (index == -1) return false;

        relations[relation].splice(index, 1);
        if (relations[relation].length == 0) delete relations[relation];

        return true;
    }
}