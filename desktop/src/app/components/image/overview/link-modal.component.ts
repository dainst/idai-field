import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { intersection } from 'tsfun';
import { CategoryForm, ProjectConfiguration, Document, Relation } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';


@Component({
    selector: 'link-modal',
    templateUrl: './link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
export class LinkModalComponent {

    public imageDocuments: Array<Document>;
    public filterOptions: Array<CategoryForm> = [];


    constructor(public activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private menuService: Menus) {}


    public getConstraints = () => {

        return {
            'id:match': {
                value: this.getIdsToIgnore(),
                subtract: true
            }
        };
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
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
