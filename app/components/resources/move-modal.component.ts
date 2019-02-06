import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {unique} from 'tsfun';
import {IdaiType, FieldDocument} from 'idai-components-2';
import {TypeUtility} from '../../core/model/type-utility';


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


    constructor(public activeModal: NgbActiveModal,
                private typeUtility: TypeUtility) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public setDocument(document: FieldDocument) {

        this.document = document;
        this.filterOptions = this.computeFilterOptions();
    }


    private computeFilterOptions(): Array<IdaiType> {

        return unique(
            this.typeUtility.getAllowedRelationRangeTypes(
                'isRecordedIn', this.document.resource.type
            ).concat(
                this.typeUtility.getAllowedRelationRangeTypes(
                    'liesWithin', this.document.resource.type
                )
            )
        );
    }
}