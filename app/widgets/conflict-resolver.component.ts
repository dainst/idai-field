import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from '../model/idai-field-document';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore'
import {DiffUtility} from '../util/diff-utility';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';

/**
 * @author Thomas Kleinke
 */
@Component({
    moduleId: module.id,
    selector: 'conflict-resolver',
    templateUrl: './conflict-resolver.html'
})

export class ConflictResolverComponent implements OnChanges {

    @Input() document: IdaiFieldDocument;
    @Input() inspectedRevisionsIds: string[];

    private conflictedRevisions: Array<IdaiFieldDocument>;
    private selectedRevision: IdaiFieldDocument;
    private differingFields: any[];
    private ready: boolean;

    constructor(
        private datastore: IdaiFieldDatastore,
        private messages: Messages,
        private configLoader: ConfigLoader) {}

    ngOnChanges() {

        this.ready = false;
        this.conflictedRevisions = [];
        this.selectedRevision = undefined;
        let promises: Array<Promise<any>> = [];

        for (let revisionId of this.document['_conflicts']) {
            if (this.inspectedRevisionsIds.indexOf(revisionId) > -1) continue;

            promises.push(this.datastore.getRevision(this.document.resource.id, revisionId).then(
                revision => {
                    this.conflictedRevisions.push(revision);
                    if (!this.selectedRevision) this.setSelectedRevision(revision);
                },
                msgWithParams => { this.messages.add(msgWithParams); }
            ));
        }

        Promise.all(promises).then(() => { this.ready = true; });
    }

    public setSelectedRevision(revision: IdaiFieldDocument) {

        this.selectedRevision = revision;
        this.differingFields = this.createDiff(revision);
    }

    private createDiff(revision: IdaiFieldDocument): any[] {

        let differingFields = [];

        let differingFieldsNames
            = DiffUtility.findDifferingFields(this.document.resource, revision.resource);

        this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            for (let fieldName of differingFieldsNames) {
                differingFields.push({
                    name: fieldName,
                    label: projectConfiguration.getFieldDefinitionLabel(this.document.resource.type,
                        fieldName),
                    rightSideWinning: false
                });
            }
        });

        return differingFields;
    }
    
    public solveConflict() {
        
        for (let field of this.differingFields) {
            if (field.rightSideWinning) {
                this.document.resource[field.name] = this.selectedRevision.resource[field.name];
            }
        }

        this.markRevisionAsInspected(this.selectedRevision);
        if (this.conflictedRevisions.length > 0) {
            this.selectedRevision = this.conflictedRevisions[0];
        } else {
            this.selectedRevision = undefined;
        }
    }

    private markRevisionAsInspected(revision: IdaiFieldDocument) {

        let index = this.conflictedRevisions.indexOf(revision);
        this.conflictedRevisions.splice(index, 1);

        this.inspectedRevisionsIds.push(revision['_rev']);
    }

}
