import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {unique} from 'tsfun';
import {IdaiType, FieldDocument, Constraint, Messages} from 'idai-components-2';
import {TypeUtility} from '../../core/model/type-utility';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {SettingsService} from '../../core/settings/settings-service';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {MoveUtility} from './move-utility';


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

    public document: FieldDocument;
    public filterOptions: Array<IdaiType> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;

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

        if (!this.constraints) {
            this.constraints = MoveUtility.createConstraints(this.document, this.datastore);
        }

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
            await MoveUtility.moveDocument(
                this.document,
                newParent,
                this.settingsService.getUsername(),
                this.persistenceManager,
                this.isRecordedInTargetTypes
            );
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.activeModal.close();
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
}