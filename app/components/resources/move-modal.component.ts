import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {unique} from 'tsfun';
import {IdaiType, FieldDocument, Document, Constraint, Messages} from 'idai-components-2';
import {TypeUtility} from '../../core/model/type-utility';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {clone} from '../../core/util/object-util';
import {SettingsService} from '../../core/settings/settings-service';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';


@Component({
    selector: 'move-modal',
    moduleId: module.id,
    templateUrl: './move-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class MoveModalComponent {

    public filterOptions: Array<IdaiType> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;

    private document: FieldDocument;
    private isRecordedInTargetTypes: Array<IdaiType>;
    private liesWithinTargetTypes: Array<IdaiType>;


    constructor(public activeModal: NgbActiveModal,
                private typeUtility: TypeUtility,
                private persistenceManager: PersistenceManager,
                private settingsService: SettingsService,
                private datastore: FieldReadDatastore,
                private messages: Messages) {
    }


    public getConstraints = () => {

        if (!this.constraints) this.constraints = this.createConstraints();
        return this.constraints;
    };


    public initialize(document: FieldDocument) {

        this.document = document;
        this.isRecordedInTargetTypes = this.getIsRecordedInTargetTypes();
        this.liesWithinTargetTypes = this.getLiesWithinTargetTypes();
        this.filterOptions = unique(this.isRecordedInTargetTypes.concat(this.liesWithinTargetTypes));
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async moveDocument(newParent: FieldDocument) {

        try {
            const oldVersion: FieldDocument = clone(this.document);
            this.updateRelations(newParent);
            await this.persistenceManager.persist(
                this.document, this.settingsService.getUsername(), oldVersion
            );
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.activeModal.close();
    }


    private updateRelations(newParent: FieldDocument) {

        if (this.isRecordedInTargetTypes.map(type => type.name)
            .includes(newParent.resource.type)) {
            this.document.resource.relations['isRecordedIn'] = [newParent.resource.id];
            this.document.resource.relations['liesWithin'] = [];
        } else {
            this.document.resource.relations['liesWithin'] = [newParent.resource.id];
            this.document.resource.relations['isRecordedIn'] = newParent.resource.relations['isRecordedIn'];
        }
    }


    private getIsRecordedInTargetTypes(): Array<IdaiType> {

        return this.typeUtility.getAllowedRelationRangeTypes(
            'isRecordedIn', this.document.resource.type
        );
    }


    private getLiesWithinTargetTypes(): Array<IdaiType> {

        return this.typeUtility.getAllowedRelationRangeTypes(
            'liesWithin', this.document.resource.type
        );
    }


    private async createConstraints(): Promise<{ [name: string]: Constraint }> {

        return {
            'id:match': {
                value: await this.getResourceIdsToSubtract(),
                type: 'subtract'
            }
        };
    }


    private async getResourceIdsToSubtract(): Promise<string[]> {

        const ids: string[] = [this.document.resource.id];

        if (Document.hasRelations(this.document, 'liesWithin')) {
            ids.push(this.document.resource.relations['liesWithin'][0]);
        } else if (Document.hasRelations(this.document, 'isRecordedIn')) {
            ids.push(this.document.resource.relations.isRecordedIn[0]);
        }

        return ids.concat(await this.getDescendentIds(this.document));
    }


    private async getDescendentIds(document: FieldDocument): Promise<string[]> {

        const descendents: Array<FieldDocument> = (await this.datastore.find(
            { constraints: { 'liesWithin:contain': document.resource.id } }
            )).documents;

        let descendentIds: string[] = descendents.map(descendent => descendent.resource.id);

        for (let descendent of descendents) {
            descendentIds = descendentIds.concat(await this.getDescendentIds(descendent));
        }

        return descendentIds;
    }
}