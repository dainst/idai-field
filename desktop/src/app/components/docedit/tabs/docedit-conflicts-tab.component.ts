import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { UtilTranslations } from '../../../core/util/util-translations';
import { Document, Datastore, Relations, Resource } from 'idai-field-core';
import { ProjectConfiguration } from '../../../core/configuration/project-configuration';
import { M } from '../../messages/m';
import { Messages } from '../../messages/messages';
import { Loading } from '../../widgets/loading';
import { formatContent } from './format-content';

const moment = require('moment');


/**
 * @author Thomas Kleinke
 */
@Component({
    selector: 'docedit-conflicts-tab',
    templateUrl: './docedit-conflicts-tab.html'
})
export class DoceditConflictsTabComponent implements OnChanges {

    @Input() document: Document;
    @Input() inspectedRevisions: Document[];

    public conflictedRevisions: Array<Document> = [];
    public selectedRevision: Document|undefined;
    public differingFields: any[];
    private relationTargets: { [targetId: string]: Document|undefined };


    constructor(private datastore: Datastore,
                private messages: Messages,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading,
                private changeDetectorRef: ChangeDetectorRef,
                private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private i18n: I18n) {}


    public isLoading = () => this.loading.isLoading('docedit-conflicts-tab');

    public showLoadingIcon = () => this.isLoading() && this.loading.getLoadingTimeInMilliseconds() > 250;

    public getFieldContent = (field: any, revision: Document) => formatContent(
        revision.resource,
        field,
        (key: string) => this.utilTranslations.getTranslation(key),
        (value: string) => this.decimalPipe.transform(value)
    );


    async ngOnChanges() {

        this.loading.start('docedit-conflicts-tab');
        this.detectChangesWhileLoading();

        this.conflictedRevisions = await this.getConflictedRevisions();

        if (this.conflictedRevisions.length > 0) {
            this.sortRevisions(this.conflictedRevisions);
            this.setSelectedRevision(this.conflictedRevisions[0]);
        } else {
            this.differingFields = [];
        }

        this.loading.stop('docedit-conflicts-tab');
    }


    public setSelectedRevision(revision: Document) {

        this.selectedRevision = revision;
        this.differingFields = this.createDiff(this.document, revision, this.projectConfiguration);

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


    public getTargetIdentifiers(targetIds: string[]): string {

        let result: string = '';

        for (let targetId of targetIds) {
            if (result.length > 0) result += ', ';
            result += this.relationTargets[targetId]
                ? (this.relationTargets[targetId] as Document).resource.identifier
                : this.i18n({ id: 'docedit.tabs.conflicts.deletedResource', value: 'Gelöschte Ressource' });
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


    public getRevisionLabel(revision: Document): string {

        moment.locale('de');
        return Document.getLastModified(revision).user
            + ' - '
            + moment(Document.getLastModified(revision).date).format('DD. MMMM YYYY HH:mm:ss [Uhr]');
    }


    private sortRevisions(revisions: Array<Document>) {

        revisions.sort((a: Document, b: Document) =>
            Document.getLastModified(a) < Document.getLastModified(b)
                ? -1
                : Document.getLastModified(a) > Document.getLastModified(b)
                ? 1
                : 0);
    }


    private async getConflictedRevisions(): Promise<Array<Document>> {

        const conflictedRevisions: Array<Document> = [];

        for (let revisionId of (this.document as any)._conflicts) {
            if (this.inspectedRevisions.find((revision: any) => revision._rev === revisionId)) {
                continue;
            }

            try {
                conflictedRevisions.push(
                    await this.datastore.getRevision(this.document.resource.id, revisionId)
                );
            } catch (err) {
                console.error('Revision not found: ' + this.document.resource.id + ' ' + revisionId);
                this.messages.add([M.DATASTORE_ERROR_NOT_FOUND]);
            }
        }

        return conflictedRevisions;
    }


    private createDiff(document: Document, revision: Document, projectConfiguration: ProjectConfiguration): any[] {

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
                label = this.i18n({ id: 'docedit.tabs.conflicts.geometry', value: 'Geometrie' });
            } else if (fieldName === 'georeference') {
                type = 'georeference';
                label = this.i18n({ id: 'docedit.tabs.conflicts.georeference', value: 'Georeferenz' });
            } else {
                type = 'field';
                label = projectConfiguration.getFieldDefinitionLabel(document.resource.category, fieldName);
            }

            const fd = projectConfiguration
                .getFieldDefinitions(document.resource.category)
                .find(fd => fd.name === fieldName);

            differingFields.push({
                name: fieldName,
                inputType: fd?.inputType,
                label: label,
                type: type,
                valuelist: fd?.valuelist,
                positionValues: fd?.positionValues,
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


    private markRevisionAsInspected(revision: Document) {

        let index = this.conflictedRevisions.indexOf(revision);
        this.conflictedRevisions.splice(index, 1);
        this.inspectedRevisions.push(revision);
    }


    private detectChangesWhileLoading() {

        this.changeDetectorRef.detectChanges();

        if (this.isLoading()) setTimeout(() => this.detectChangesWhileLoading(), 100);
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


    private async fetchRelationTargetsOfField(resource: Resource, fieldName: string) {

        if (resource.relations[fieldName]) {
            const targets: Array<Document> = await this.datastore.getMultiple(resource.relations[fieldName]);
            targets.forEach(target => this.relationTargets[target.resource.id] = target);
        }
    }
}
