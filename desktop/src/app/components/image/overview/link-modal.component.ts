import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Category} from 'idai-field-core';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';


@Component({
    selector: 'link-modal',
    templateUrl: './link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class LinkModalComponent {

    public filterOptions: Array<Category> = [];


    constructor(public activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initializeFilterOptions() {

        this.filterOptions = this.projectConfiguration.getAllowedRelationDomainCategories(
            'isDepictedIn', 'Image'
        );
    }
}
