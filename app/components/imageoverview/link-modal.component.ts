import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiType} from 'idai-components-2';
import {TypeUtility} from '../../core/model/type-utility';


@Component({
    selector: 'link-modal',
    moduleId: module.id,
    templateUrl: './link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class LinkModalComponent {

    public filterOptions: Array<IdaiType> = [];


    constructor(public activeModal: NgbActiveModal,
                private typeUtility: TypeUtility) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initializeFilterOptions() {

        this.filterOptions = this.typeUtility.getAllowedRelationRangeTypes(
            'isDepictedIn', 'Image'
        );
    }
}