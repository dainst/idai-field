import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, ProjectConfiguration } from 'idai-field-core';


@Component({
    selector: 'link-modal',
    templateUrl: './link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class LinkModalComponent {

    public filterOptions: Array<CategoryForm> = [];


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
