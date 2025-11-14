import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Labels, Relation } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';


@Component({
    templateUrl: './delete-category-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteCategoryModalComponent {

    public category: CategoryForm;
    public labels: Labels;
    public customized: boolean;
    public relations: Array<Relation>;
    public resourceCount: number;

    public confirmDeletionCategoryName: string;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public isDeletionAllowed = () => !this.hasChildCategories() && !this.isRelationTargetCategory();
    
    public hasChildCategories = () => this.category.children.length > 0;

    public isConfirmationDialogVisible = () => this.customized || this.resourceCount > 0;

    public confirmDeletion = () => (!this.isConfirmationDialogVisible() || this.checkConfirmDeletionCategoryName())
        && this.activeModal.close();
    
    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.CONFIGURATION_MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public isRelationTargetCategory(): boolean {

        return this.relations.find(relation => {
            return relation.range.includes(this.category.name)
                && (Relation.Workflow.ALL.includes(relation.name) || relation.source === 'custom');
        }) !== undefined;
    }


    public checkConfirmDeletionCategoryName(): boolean {
        
        return this.confirmDeletionCategoryName === this.category.name
            || this.confirmDeletionCategoryName === this.labels.get(this.category);
    };
}
