import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from '../model/idai-field-document';
import {IdaiFieldResource} from '../model/idai-field-resource';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore'
import {DiffUtility} from '../util/diff-utility';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {PersistenceManager} from 'idai-components-2/persist';

const moment = require('moment');

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
    private relationTargets: { [targetId: string]: IdaiFieldDocument };
    private ready: boolean;

    constructor(
        private datastore: IdaiFieldDatastore,
        private messages: Messages,
        private configLoader: ConfigLoader,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private persistenceManager: PersistenceManager) {}

    ngOnChanges() {

        this.ready = false;
        this.conflictedRevisions = [];
        this.selectedRevision = undefined;
        let promises: Array<Promise<any>> = [];

        for (let revisionId of this.document['_conflicts']) {
            if (this.inspectedRevisionsIds.indexOf(revisionId) > -1) continue;

            promises.push(this.datastore.getRevision(this.document.resource.id, revisionId).then(
                revision => this.conflictedRevisions.push(revision),
                msgWithParams => this.messages.add(msgWithParams)
            ));
        }

        Promise.all(promises).then(() => {
            if (this.conflictedRevisions.length > 0) {
                this.sortRevisions(this.conflictedRevisions);
                this.setSelectedRevision(this.conflictedRevisions[0]);
            }
            this.ready = true;
        });
    }

    public setSelectedRevision(revision: IdaiFieldDocument) {

        this.selectedRevision = revision;
        this.createDiff(revision).then(
            differingFields => {
                this.differingFields = differingFields;
                this.fetchRelationTargets();
            }
        );
    }

    private createDiff(revision: IdaiFieldDocument): Promise<any[]> {

        let differingFields = [];

        let differingFieldsNames: string[]
            = DiffUtility.findDifferingFields(this.document.resource, revision.resource);
        let differingRelationsNames: string[]
            = DiffUtility.findDifferingRelations(this.document.resource, revision.resource);

        return this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            for (let fieldName of differingFieldsNames) {
                let type: string;
                let label: string;

                if (fieldName == 'geometry') {
                    type = 'geometry';
                    label = 'Geometrie';
                } else if (fieldName == 'georeference') {
                    type = 'georeference';
                    label = 'Georeferenz';
                } else {
                    type = 'field';
                    label = projectConfiguration.getFieldDefinitionLabel(this.document.resource.type, fieldName);
                }

                differingFields.push({
                    name: fieldName,
                    label: label,
                    type: type,
                    rightSideWinning: false
                });
            }

            for (let relationName of differingRelationsNames) {
                differingFields.push({
                    name: relationName,
                    label: projectConfiguration.getRelationDefinitionLabel(relationName),
                    type: 'relation',
                    rightSideWinning: false
                });
            }

            return Promise.resolve(differingFields);
        });
    }
    
    public solveConflict() {
        
        for (let field of this.differingFields) {
            if (field.rightSideWinning) {
                if (field.type == 'relation') {
                    if (this.selectedRevision.resource.relations[field.name]) {
                        this.document.resource.relations[field.name]
                            = this.selectedRevision.resource.relations[field.name];
                    } else {
                        delete this.document.resource.relations[field.name];
                    }
                } else {
                    this.document.resource[field.name] = this.selectedRevision.resource[field.name];
                }
            }
        }

        this.persistenceManager.addOldVersion(this.selectedRevision);

        this.markRevisionAsInspected(this.selectedRevision);
        if (this.conflictedRevisions.length > 0) {
            this.setSelectedRevision(this.conflictedRevisions[0]);
        } else {
            this.selectedRevision = undefined;
            this.differingFields = [];
        }

        this.documentEditChangeMonitor.setChanged();
    }

    private markRevisionAsInspected(revision: IdaiFieldDocument) {

        let index = this.conflictedRevisions.indexOf(revision);
        this.conflictedRevisions.splice(index, 1);

        this.inspectedRevisionsIds.push(revision['_rev']);
    }

    private fetchRelationTargets() {

        this.relationTargets = {};

        for (let field of this.differingFields) {
            if (field.type == 'relation') {
                this.fetchRelationTargetsOfField(this.document.resource, field.name);
                this.fetchRelationTargetsOfField(this.selectedRevision.resource, field.name);
            }
        }
    }

    private fetchRelationTargetsOfField(resource: IdaiFieldResource, fieldName: string) {

        if (resource.relations[fieldName]) {
            for (let targetId of resource.relations[fieldName]) {
                this.datastore.get(targetId).then(
                    doc => { this.relationTargets[targetId] = <IdaiFieldDocument> doc; },
                    msgWithParams => this.messages.add(msgWithParams)
                );
            }
        }
    }

    public getTargetIdentifiers(targetIds: string[]): string {

        let result: string = '';

        for (let targetId of targetIds) {
            if (this.relationTargets[targetId]) {
                if (result.length > 0) result += ', ';
                result += this.relationTargets[targetId].resource.identifier;
            }
        }

        return result;
    }

    public getWinningSide(): string {

        if (this.differingFields.length == 0) return 'left';

        let winningSide = '';

        for (let field of this.differingFields) {
            if (winningSide == '') {
                winningSide = field.rightSideWinning ? 'right' : 'left';
            } else if ((winningSide == 'left' && field.rightSideWinning)
                    || (winningSide == 'right' && !field.rightSideWinning)) {
                return 'mixed';
            }
        }

        return winningSide;
    }

    public switchWinningSide() {

        let winningSide: string = this.getWinningSide();
        let newValue: boolean = (winningSide == 'left') ? true : false;

        for (let field of this.differingFields) {
            field.rightSideWinning = newValue;
        }
    }

    private sortRevisions(revisions: Array<IdaiFieldDocument>) {

        revisions.sort((a: IdaiFieldDocument, b: IdaiFieldDocument) => {
            const date1: Date = new Date(a.modified);
            const date2: Date = new Date(b.modified);
            if (date1 < date2) {
                return -1;
            } else if (date1 > date2) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    public getRevisionLabel(revision: IdaiFieldDocument): string {

        const date: Date = new Date(revision['modified']);
        moment.locale('de');

        return moment(date).format('DD. MMMM YYYY HH:mm:ss [Uhr]');
    }
}
