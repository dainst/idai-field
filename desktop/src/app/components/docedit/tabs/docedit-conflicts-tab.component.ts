import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Document, Datastore, Resource, Labels, CategoryForm, ProjectConfiguration, Field } from 'idai-field-core';
import { UtilTranslations } from '../../../util/util-translations';
import { Messages } from '../../messages/messages';
import { Loading } from '../../widgets/loading';
import { WinningSide } from './revision-selector.component';
import { formatContent } from './format-content';
import { ConflictResolving } from './conflict-resolving';
import { Languages } from '../../../services/languages';
import { DifferingField, DifferingFieldType } from './field-diff';


/**
 * @author Thomas Kleinke
 */
@Component({
    selector: 'docedit-conflicts-tab',
    templateUrl: './docedit-conflicts-tab.html'
})
export class DoceditConflictsTabComponent implements OnChanges {

    @Input() document: Document;
    @Input() inspectedRevisions: Array<Document>;

    public conflictedRevisions: Array<Document> = [];
    public selectedRevision: Document|undefined;
    public differingFields: Array<DifferingField>;
    private relationTargets: { [targetId: string]: Document|undefined };


    constructor(private datastore: Datastore,
                private messages: Messages,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading,
                private changeDetectorRef: ChangeDetectorRef,
                private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels,
                private i18n: I18n) {}


    public isLoading = () => this.loading.isLoading('docedit-conflicts-tab');

    public showLoadingIcon = () => this.isLoading()
        && this.loading.getLoadingTimeInMilliseconds('docedit-conflicts-tab') > 250;

    public getFieldContent = (field: DifferingField, revision: Document) => formatContent(
        revision.resource,
        field,
        (key: string) => this.utilTranslations.getTranslation(key),
        (value: string) => this.decimalPipe.transform(value),
        this.labels,
        Languages.getAvailableLanguages()
    );


    async ngOnChanges() {

        this.loading.start('docedit-conflicts-tab');
        this.detectChangesWhileLoading();

        this.conflictedRevisions = await this.getConflictedRevisions();

        if (this.conflictedRevisions.length > 0) {
            ConflictResolving.sortRevisions(this.conflictedRevisions);
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

        ConflictResolving.markRevisionAsInspected(
            this.selectedRevision, this.conflictedRevisions, this.inspectedRevisions
        );
        
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


    public getWinningSide(): WinningSide {

        if (this.differingFields.length === 0) return 'left';

        let winningSide: WinningSide;

        for (let field of this.differingFields) {
            if (!winningSide) {
                winningSide = field.rightSideWinning ? 'right' : 'left';
            } else if ((winningSide === 'left' && field.rightSideWinning)
                    || (winningSide === 'right' && !field.rightSideWinning)) {
                return 'mixed';
            }
        }

        return winningSide;
    }


    public setWinningSide(winningSide: WinningSide) {

        for (let field of this.differingFields) field.rightSideWinning = winningSide === 'right';
    }


    public setWinningSideForField(field: DifferingField, rightSideWinning: boolean) {

        field.rightSideWinning = rightSideWinning;
    }


    private getConflictedRevisions(): Promise<Array<Document>> {

        try {
            return ConflictResolving.getConflictedRevisions(this.document, this.inspectedRevisions, this.datastore);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    private createDiff(document: Document, revision: Document,
                       projectConfiguration: ProjectConfiguration): Array<DifferingField> {

        let differingFields: Array<DifferingField> = [];

        const differingFieldsNames: string[]
            = Resource.getDifferingFields(document.resource, revision.resource);
        const differingRelationsNames: string[]
            = Resource.getDifferingRelations(document.resource, revision.resource);

        for (let fieldName of differingFieldsNames) {
            let type: DifferingFieldType;
            let label: string;

            if (fieldName === 'geometry') {
                type = 'geometry';
                label = this.i18n({ id: 'docedit.tabs.conflicts.geometry', value: 'Geometrie' });
            } else if (fieldName === 'georeference') {
                type = 'georeference';
                label = this.i18n({ id: 'docedit.tabs.conflicts.georeference', value: 'Georeferenz' });
            } else {
                type = 'field';
                label = this.labels.getFieldLabel(this.projectConfiguration.getCategory(document), fieldName);
            }

            const field: Field = CategoryForm.getFields(projectConfiguration.getCategory(document))
                .find(fd => fd.name === fieldName);

            differingFields.push({
                name: fieldName,
                inputType: field?.inputType,
                label: label,
                type: type,
                valuelist: field?.valuelist,
                subfields: field?.subfields,
                rightSideWinning: false
            });
        }

        for (let relationName of differingRelationsNames) {
            differingFields.push({
                name: relationName,
                label: this.labels.getFieldLabel(projectConfiguration.getCategory(document), relationName),
                type: 'relation',
                rightSideWinning: false
            });
        }

        return differingFields;
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
