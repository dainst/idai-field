import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { CategoryForm, Datastore, Resource, FieldDocument, Name, Named, Tree,
    ProjectConfiguration } from 'idai-field-core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ResourcesComponent } from './resources.component';
import { ComponentHelpers } from '../component-helpers';


export type PlusButtonStatus = 'enabled'|'disabled-hierarchy';


@Component({
    selector: 'plus-button',
    templateUrl: './plus-button.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent implements OnChanges {

    @Input() placement: string = 'bottom'; // top | bottom | left | right

    // undefined when in overview or type management
    @Input() isRecordedIn: FieldDocument|undefined;

    // undefined when current level is operation
    @Input() liesWithin: FieldDocument|undefined;

    @Input() preselectedCategory: string;
    @Input() preselectedGeometryType: string;
    @Input() skipFormAndReturnNewDocument: boolean = false;
    @Input() status: PlusButtonStatus = 'enabled';

    @Output() documentRequested: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    @ViewChild('popover', { static: false }) private popover: any;

    public selectedCategory: string|undefined;
    public toplevelCategoriesArray: Array<CategoryForm>;


    constructor(
        private elementRef: ElementRef,
        private resourcesComponent: ResourcesComponent,
        private projectConfiguration: ProjectConfiguration,
        private messages: Messages,
        private viewFacade: ViewFacade,
        private datastore: Datastore,
        private i18n: I18n) {

        this.resourcesComponent.listenToClickEvents().subscribe(event => {
            this.handleClick(event);
        });
    }


    public isGeometryCategory = (category: Name) =>
        this.projectConfiguration.isGeometryCategory(category);


    ngOnChanges() {

        this.initializeSelectableCategoriesArray(this.projectConfiguration);
    }


    public async startDocumentCreation(geometryType: string = this.preselectedGeometryType) {

        if (this.popover) this.popover.close();

        try {
            await this.assertParentResourceStillExists();
        } catch (msgWithParams) {
            return this.messages.add(msgWithParams);
        }

        const newDocument: FieldDocument = <FieldDocument> {
            resource: {
                identifier: '',
                relations: this.createRelations(),
                category: this.selectedCategory
            }
        };
        if (this.skipFormAndReturnNewDocument) this.documentRequested.emit(newDocument);
        else this.resourcesComponent.startEditNewDocument(newDocument, geometryType);
    }


    public reset() {

        this.selectedCategory = this.getButtonType() === 'singleCategory'
            ? this.toplevelCategoriesArray[0].name
            : this.selectedCategory = undefined;
    }


    public getButtonType(): 'singleCategory'|'multipleCategories'|'none' {

        if (this.toplevelCategoriesArray.length === 0) return 'none';

        if (this.toplevelCategoriesArray.length === 1
                && (!this.toplevelCategoriesArray[0].children || this.toplevelCategoriesArray[0].children.length === 0)) {
            return 'singleCategory';
        }

        return 'multipleCategories';
    }


    public chooseCategory(category: CategoryForm) {

        this.selectedCategory = category.name;

        if (this.preselectedGeometryType) {
            this.startDocumentCreation();
        } else if (!this.isGeometryCategory(this.selectedCategory)) {
            this.startDocumentCreation('none');
        }
    }


    public getTooltip(): string {

        switch(this.status) {
            case 'enabled':
                return '';
            case 'disabled-hierarchy':
                return this.i18n({
                    id: 'resources.plusButton.tooltip.deactivated',
                    value: 'Bitte deaktivieren Sie den erweiterten Suchmodus, um neue Ressourcen anlegen zu können.'
                });
        }
    }


    private handleClick(event: any) {

        if (!this.popover) return;

        if (!ComponentHelpers.isInside(event.target, target =>
                target === this.elementRef.nativeElement
                    || target.id === 'new-object-menu'
                    || target.id === 'geometry-type-selection')) {

            this.popover.close();
        }
    }


    private initializeSelectableCategoriesArray(projectConfiguration: ProjectConfiguration) {

        this.toplevelCategoriesArray = [];

        if (this.preselectedCategory) {
            const category: CategoryForm = projectConfiguration.getCategory(this.preselectedCategory);
            if (category) {
                this.toplevelCategoriesArray.push(category);
            } else {
                this.messages.add([M.RESOURCES_ERROR_CATEGORY_NOT_FOUND, this.preselectedCategory]);
            }
        } else {
            for (let category of Tree.flatten(projectConfiguration.getCategories())) {
                if (this.isAllowedCategory(category, projectConfiguration)
                        && (!category.parentCategory
                            || !this.isAllowedCategory(category.parentCategory, projectConfiguration))) {
                    this.toplevelCategoriesArray.push(category);
                }
            }
        }
    }


    private createRelations(): Resource.Relations {

        const relations: Resource.Relations = {};
        relations['isRecordedIn'] = this.isRecordedIn
            ? [this.isRecordedIn.resource.id]
            : [];

        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];
        return relations;
    }


    private isAllowedCategory(category: CategoryForm, projectConfiguration: ProjectConfiguration): boolean {

        if (category.name === 'Image') return false;

        if (this.isRecordedIn) {
            if (!projectConfiguration.isAllowedRelationDomainCategory(category.name,
                this.isRecordedIn.resource.category, 'isRecordedIn')) {
                return false;
            }
        } else {
            if (!(this.viewFacade.isInOverview()
                    ? this.projectConfiguration.getConcreteOverviewCategories().map(Named.toName).includes(category.name)
                    : this.projectConfiguration.getTypeCategories().map(Named.toName).includes(category.name))) {
                return false;
            }
        }

        if (!this.liesWithin) return !category.mustLieWithin;

        return projectConfiguration.isAllowedRelationDomainCategory(
            category.name, this.liesWithin.resource.category, 'liesWithin'
        );
    }


    private async assertParentResourceStillExists() {

        try {
            if (this.isRecordedIn) await this.datastore.get(this.isRecordedIn.resource.id);
            if (this.liesWithin) await this.datastore.get(this.liesWithin.resource.id);
        } catch {
            throw [M.RESOURCES_ERROR_PARENT_RESOURCE_DELETED];
        }
    }
}
