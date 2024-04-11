import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Document, Labels, ProjectConfiguration } from 'idai-field-core';
import { FixingDataInProgressModalComponent } from './fixing-data-in-progress-modal.component';
import { WarningsService } from '../../../../services/warnings/warnings-service';


@Component({
    templateUrl: './select-new-category-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class SelectNewCategoryModalComponent {

    public document: Document;

    public availableTopLevelCategories: Array<CategoryForm>;
    public selectedCategory: CategoryForm;
    public multiple: boolean;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private labels: Labels,
                private warningsService: WarningsService) {}

    
    public getCategoryLabel = (category: CategoryForm) => this.labels.get(category);

    public getSelectedCategoryNames = () => this.selectedCategory ? [this.selectedCategory.name] : [];

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initialize() {

        this.availableTopLevelCategories = this.getAvailableTopLevelCategories();
    }


    public async perform() {

        if (!this.selectedCategory) return;

        const fixingDataInProgressModal: NgbModalRef = this.openFixingDataInProgressModal();

        if (this.multiple) {
            await this.performMultiple();
        } else {
            await this.performSingle();
        }

        this.warningsService.reportCategoryChange();

        fixingDataInProgressModal.close();
        this.activeModal.close();
    }


    private async performSingle() {

        this.document.resource.category = this.selectedCategory.name;
        await this.datastore.update(this.document);
    }


    private async performMultiple() {

        const documents = (await this.datastore.find({
            categories: ['UNCONFIGURED'],
        })).documents;

        documents.filter(document => document.resource.category === this.document.resource.category)
            .forEach(document => document.resource.category = this.selectedCategory.name);

        await this.datastore.bulkUpdate(documents);
    }


    private getAvailableTopLevelCategories(): Array<CategoryForm> {

        return this.projectConfiguration.getCategories()
            .map(tree => tree.item)
            .filter(category => category.name !== 'Project');
    }


    private openFixingDataInProgressModal(): NgbModalRef {

        const fixingDataInProgressModalRef: NgbModalRef = this.modalService.open(
            FixingDataInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        fixingDataInProgressModalRef.componentInstance.multiple = this.multiple;
        
        return fixingDataInProgressModalRef;
    }
}
