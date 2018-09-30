import {Component, Input, OnChanges} from '@angular/core';
import {Relations, Resource, Document, Messages, ProjectConfiguration} from 'idai-components-2';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {M} from '../../m';

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

    @Input() document: Document;
    @Input() inspectedRevisions: Document[];

    private conflictedRevisions: Array<Document> = [];
    private selectedRevision: Document|undefined;
    private differingFields: any[];
    private relationTargets: { [targetId: string]: Document|undefined };
    private ready = false;


    constructor(
        private datastore: DocumentReadDatastore,
        private messages: Messages,
        private projectConfiguration: ProjectConfiguration) {}


    async ngOnChanges() {

        for (let revisionId of (this.document as any)['_conflicts']) {
            if (this.inspectedRevisions.map(_ => _.resource.id).includes(revisionId)) continue;

            try {
                this.conflictedRevisions.push(
                    await this.datastore.getRevision(this.document.resource.id, revisionId)
                );
            } catch (_) {
                console.error("revision not found " + this.document.resource.id + " " + revisionId);
                this.messages.add([M.DATASTORE_NOT_FOUND])
            }
        }

        if (this.conflictedRevisions.length > 0) {
            this.sortRevisions(this.conflictedRevisions);
            this.setSelectedRevision(this.conflictedRevisions[0]);
        } else {
            this.differingFields = [];
        }
        this.ready = true;
    }


    public setSelectedRevision(revision: Document) {

        this.selectedRevision = revision;

        this.differingFields = DoceditConflictsTabComponent.createDiff(
            this.document, revision, this.projectConfiguration);

        this.fetchRelationTargets();
    }

    
    public solveConflict() {

        if (!this.selectedRevision) return;
        
        for (let field of this.differingFields) {
            if (field.rightSideWinning) {
                if (field.type === 'relation') {
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

        this.markRevisionAsInspected(this.selectedRevision);
        if (this.conflictedRevisions.length > 0) {
            this.setSelectedRevision(this.conflictedRevisions[0]);
        } else {
            this.selectedRevision = undefined;
            this.differingFields = [];
        }
    }


    private markRevisionAsInspected(revision: Document) {

        let index = this.conflictedRevisions.indexOf(revision);
        this.conflictedRevisions.splice(index, 1);
        this.inspectedRevisions.push(revision);
    }


    private fetchRelationTargets() {

        if (!this.selectedRevision) return;

        this.relationTargets = {};

        for (let field of this.differingFields) {
            if (field.type === 'relation') {
                this.fetchRelationTargetsOfField(this.document.resource, field.name);
                this.fetchRelationTargetsOfField(this.selectedRevision.resource, field.name);
            }
        }
    }


    private fetchRelationTargetsOfField(resource: Resource, fieldName: string) {

        if (resource.relations[fieldName]) {
            for (let targetId of resource.relations[fieldName]) {
                this.datastore.get(targetId).then(
                    doc => { this.relationTargets[targetId] = doc; },
                    (err) => { console.error(err); this.relationTargets[targetId] = undefined; }
                );
            }
        }
    }


    public getTargetIdentifiers(targetIds: string[]): string {

        let result: string = '';

        for (let targetId of targetIds) {
            if (result.length > 0) result += ', ';
            result += this.relationTargets[targetId]
                ? (this.relationTargets[targetId] as Document).resource.identifier
                : 'Gelöschte Ressource';
        }

        return result;
    }


    public getWinningSide(): string {

        if (this.differingFields.length === 0) return 'left';

        let winningSide = '';

        for (let field of this.differingFields) {
            if (winningSide === '') {
                winningSide = field.rightSideWinning ? 'right' : 'left';
            } else if ((winningSide === 'left' && field.rightSideWinning)
                    || (winningSide === 'right' && !field.rightSideWinning)) {
                return 'mixed';
            }
        }

        return winningSide;
    }


    public setWinningSide(rightSideWinning: boolean) {

        for (let field of this.differingFields) field.rightSideWinning = rightSideWinning;
    }


    public setWinningSideForField(field: any, rightSideWinning: boolean) {

        field.rightSideWinning = rightSideWinning;
    }


    private sortRevisions(revisions: Array<Document>) {

        revisions.sort((a: Document, b: Document) =>
            Document.getLastModified(a) < Document.getLastModified(b)
                ? -1
                : Document.getLastModified(a) > Document.getLastModified(b)
                    ? 1
                    : 0);
    }


    public getRevisionLabel(revision: Document): string {

        moment.locale('de');
        return Document.getLastModified(revision).user
            + ' - '
            + moment(Document.getLastModified(revision).date).format('DD. MMMM YYYY HH:mm:ss [Uhr]');
    }


    public getFieldContent(field: any, revision: Document): string {

        const fieldContent: any = revision.resource[field.name];

        return fieldContent instanceof Array
            ? this.getContentStringFor(fieldContent)
            : fieldContent;
    }


    public getContentStringFor(fieldContent: any[]): string {

        let contentString: string = '';
        for (let element of fieldContent) {
            if (element.label) {
                contentString += '<div>' + element.label + '</div>';
            } else {
                if (contentString.length > 0) contentString += ', ';
                contentString += element;
            }
        }
        return contentString;
    }


    private static createDiff(document: Document, revision: Document,
                              projectConfiguration: ProjectConfiguration): any[] {

        let differingFields: any[] = [];

        const differingFieldsNames: string[]
            = Resource.getDifferingFields(document.resource, revision.resource);
        const differingRelationsNames: string[]
            = Relations.getDifferent(document.resource.relations, revision.resource.relations);

        for (let fieldName of differingFieldsNames) {
            let type: string;
            let label: string;

            if (fieldName === 'geometry') {
                type = 'geometry';
                label = 'Geometrie';
            } else if (fieldName === 'georeference') {
                type = 'georeference';
                label = 'Georeferenz';
            } else {
                type = 'field';
                label = projectConfiguration.getFieldDefinitionLabel(document.resource.type, fieldName);
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

        return differingFields;
    }
}
