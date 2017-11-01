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
     * The method returns a set of the target documents which need an update.
     * The target documents will have set their relations accordingly.
     *
     * @param document
     * @param targetDocuments
     * @param setInverseRelations
     * @return {Array} the instances of targetDocuments which need an update
     */
    public determineDocsToUpdate(document: Document, targetDocuments: Array<Document>, setInverseRelations: boolean) {

        const copyOfTargetDocuments = JSON.parse(JSON.stringify(targetDocuments));

        for (let targetDocument of targetDocuments) {
            this.pruneInverseRelations(document.resource.id as any, targetDocument, setInverseRelations);
            if (setInverseRelations) this.setInverseRelations(document, targetDocument);
        }

        return this.compare(targetDocuments, copyOfTargetDocuments);
    }

    private compare(targetDocuments: any, copyOfTargetDocuments: any) {
        
        const docsToUpdate = [];
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

            if (!same) docsToUpdate.push(targetDocuments[i]);
        }
        return docsToUpdate;
    }

    private pruneInverseRelations(resourceId: string, targetDocument: Document, keepAllNoInverseRelations: boolean) {

        for (let relation in targetDocument.resource.relations) {
            if (!this.projectConfiguration.isRelationProperty(relation)) continue;
            if (keepAllNoInverseRelations && this.projectConfiguration.getInverseRelations(relation) == 'NO-INVERSE') {
                continue;
            }

            this.removeRelation(resourceId, targetDocument.resource.relations, relation);
        }
    }

    private removeRelation(resourceId: string, relations: any, relation: string): boolean {
        
        const index = relations[relation].indexOf(resourceId);
        if (index == -1) return false;

        relations[relation].splice(index, 1);
        if (relations[relation].length == 0) delete relations[relation];

        return true;
    }

    private setInverseRelations(document: Document, targetDocument: Document) {

        for (let relation in document.resource.relations) {

            if (!this.projectConfiguration.isRelationProperty(relation)) continue;

            const inverse = this.projectConfiguration.getInverseRelations(relation);
            if (inverse == 'NO-INVERSE') continue;

            for (let id of document.resource.relations[relation]) {
                if (id != targetDocument.resource.id) continue;

                if (targetDocument.resource.relations[inverse as any] == undefined)
                    targetDocument.resource.relations[inverse as any] = [];

                const index = targetDocument.resource.relations[inverse as any].indexOf(document.resource.id as any);
                if (index != -1) {
                    targetDocument.resource.relations[inverse as any].splice(index, 1);
                }

                targetDocument.resource.relations[inverse as any].push(document.resource.id as any);
            }
        }
    }
}