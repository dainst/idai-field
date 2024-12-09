import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { intersection } from 'tsfun';
import { CategoryForm, ProjectConfiguration, Document, Relation } from 'idai-field-core';


@Component({
    selector: 'link-modal',
    templateUrl: './link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class LinkModalComponent {

    public imageDocuments: Array<Document>;
    public filterOptions: Array<CategoryForm> = [];

    public getConstraints = () => {

        return {
            'id:match': {
                value: this.getIdsToIgnore(),
                subtract: true
            }
        };
    }


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


    private getIdsToIgnore(): string[] {

        return intersection(this.imageDocuments.map(document => {
            return document.resource.relations[Relation.Image.DEPICTS] ?? [];
        }));
    }
}
