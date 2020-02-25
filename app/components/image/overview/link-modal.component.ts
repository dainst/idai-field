import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProjectTypes} from '../../../core/configuration/project-types';
import {IdaiType} from '../../../core/configuration/model/idai-type';


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
                private projectTypes: ProjectTypes) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initializeFilterOptions() {

        this.filterOptions = this.projectTypes.getAllowedRelationDomainTypes(
            'isDepictedIn', 'Image'
        );
    }
}