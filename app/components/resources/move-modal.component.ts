import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {unique} from 'tsfun';
import {IdaiType, FieldDocument} from 'idai-components-2';
import {TypeUtility} from '../../core/model/type-utility';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {clone} from '../../core/util/object-util';
import {SettingsService} from '../../core/settings/settings-service';


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

    private document: FieldDocument;
    private isRecordedInTargetTypes: Array<IdaiType>;
    private liesWithinTargetTypes: Array<IdaiType>;


    constructor(public activeModal: NgbActiveModal,
                private typeUtility: TypeUtility,
                private persistenceManager: PersistenceManager,
                private settingsService: SettingsService) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public setDocument(document: FieldDocument) {

        this.document = document;
        this.isRecordedInTargetTypes = this.getIsRecordedInTargetTypes();
        this.liesWithinTargetTypes = this.getLiesWithinTargetTypes();
        this.filterOptions = unique(this.isRecordedInTargetTypes.concat(this.liesWithinTargetTypes));
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


    public async moveDocument(newParent: FieldDocument) {

        const oldVersion: FieldDocument = clone(this.document);

        this.updateRelations(newParent);
        await this.persistenceManager.persist(this.document, this.settingsService.getUsername(), oldVersion);

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
}