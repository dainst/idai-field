import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument, IdaiFieldResource} from 'idai-components-2/idai-field-model';
import {Action} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {PersistenceManager} from 'idai-components-2/persist';
import {CachedDatastore} from '../../core/datastore/core/cached-datastore'
import {IdaiFieldDiffUtility} from '../../core/model/idai-field-diff-utility';
import {ChangeHistoryUtil} from '../../core/model/change-history-util';
import {M} from '../../m';
import {IdaiFieldDocumentReadDatastore} from "../../core/datastore/idai-field-document-read-datastore";

const moment = require('moment');

/**
 * @author Thomas Kleinke
 */
@Component({
    moduleId: module.id,
    selector: 'docedit-conflicts-tab',
    templateUrl: './docedit-conflicts-tab.html'
})
export class DoceditConflictsTabComponent implements OnChanges {

    @Input() document: IdaiFieldDocument;
    @Input() inspectedRevisionsIds: string[];

    private conflictedRevisions: Array<IdaiFieldDocument>;
    private selectedRevision: IdaiFieldDocument|undefined;
    private differingFields: any[];
    private relationTargets: { [targetId: string]: IdaiFieldDocument };
    private ready: boolean;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private messages: Messages,
        private configLoader: ConfigLoader,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private persistenceManager: PersistenceManager) {}


    ngOnChanges() {

        this.ready = false;
        this.conflictedRevisions = [];
        this.selectedRevision = undefined;
        let promises: Array<Promise<any>> = [];

        for (let revisionId of (this.document as any)['_conflicts']) {
            if (this.inspectedRevisionsIds.indexOf(revisionId) > -1) continue;

            promises.push(this.datastore.getRevision(this.document.resource.id as any, revisionId).then(
                revision => this.conflictedRevisions.push(revision),
                () => this.messages.add([M.DATASTORE_NOT_FOUND])
            ));
        }

        Promise.all(promises).then(() => {
            if (this.conflictedRevisions.length > 0) {
                this.sortRevisions(this.conflictedRevisions);
                this.setSelectedRevision(this.conflictedRevisions[0]);
            } else {
                this.differingFields = [];
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

        let differingFields: any[] = [];

        let differingFieldsNames: string[]
            = IdaiFieldDiffUtility.findDifferingFields(this.document.resource, revision.resource);
        let differingRelationsNames: string[]
            = IdaiFieldDiffUtility.findDifferingRelations(this.document.resource, revision.resource);

        return (this.configLoader.getProjectConfiguration() as any).then((projectConfiguration: any) => {

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

        if (!this.selectedRevision) return;
        
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

        ChangeHistoryUtil.mergeChangeHistories(this.document, this.selectedRevision);

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

        this.inspectedRevisionsIds.push((revision as any)['_rev']);
    }

    private fetchRelationTargets() {

        if (!this.selectedRevision) return;

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
                    () => this.messages.add([M.DATASTORE_NOT_FOUND])
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


    public setWinningSide(rightSideWinning: boolean) {

        for (let field of this.differingFields) {
            field.rightSideWinning = rightSideWinning;
        }
    }


    public setWinningSideForField(field: any, rightSideWinning: boolean) {

        field.rightSideWinning = rightSideWinning;
    }


    private sortRevisions(revisions: Array<IdaiFieldDocument>) {

        revisions.sort((a: IdaiFieldDocument, b: IdaiFieldDocument) => {
            const date1: Date = new Date((a.modified as any)[(a.modified as any).length-1].date);
            const date2: Date = new Date((b.modified as any)[(b.modified as any).length-1].date);
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

        const revision_: any = revision;

        let latestAction: Action;
        if (revision_['modified'] && revision_['modified'].length > 0) {
            latestAction = revision_['modified'][revision_['modified'].length - 1];
        } else {
            latestAction = revision_['created'] as any;
        }
        const date: Date = new Date(latestAction.date as any);
        moment.locale('de');

        return latestAction.user + " - " + moment(date).format('DD. MMMM YYYY HH:mm:ss [Uhr]');
    }


    public getFieldContent(field: any, revision: IdaiFieldDocument): string {

        const fieldContent: any = revision.resource[field.name];

        if (fieldContent instanceof Array) {
            let contentString: string = '';
            for (let element of fieldContent) {
                if (element.hasLabel) {
                    contentString += '<div>' + element.hasLabel + '</div>';
                } else {
                    if (contentString.length > 0) contentString += ', ';
                    contentString += element;
                }
            }
            return contentString;
        } else {
            return fieldContent;
        }
    }
}
