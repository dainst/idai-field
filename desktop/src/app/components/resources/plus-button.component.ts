import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { Category, Datastore, FieldDocument, Name } from 'idai-field-core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Relations } from 'idai-field-core';
import { ProjectCategories } from '../../core/configuration/project-categories';
import { ProjectConfiguration } from '../../core/configuration/project-configuration';
import { ViewFacade } from '../../core/resources/view/view-facade';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ResourcesComponent } from './resources.component';


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
    public toplevelCategoriesArray: Array<Category>;


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
        ProjectCategories.isGeometryCategory(this.projectConfiguration.getCategoryForest(), category);


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


    public chooseCategory(category: Category) {

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

        let target = event.target;
        let inside = false;

        do {
            if (target === this.elementRef.nativeElement
                || target.id === 'new-object-menu'
                || target.id === 'geometry-type-selection') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.popover.close();
    }


    private initializeSelectableCategoriesArray(projectConfiguration: ProjectConfiguration) {

        this.toplevelCategoriesArray = [];

        if (this.preselectedCategory) {
            const category: Category = projectConfiguration.getCategory(this.preselectedCategory);
            if (category) {
                this.toplevelCategoriesArray.push(category);
            } else {
                this.messages.add([M.RESOURCES_ERROR_CATEGORY_NOT_FOUND, this.preselectedCategory]);
            }
        } else {
            for (let category of projectConfiguration.getCategoriesArray()) {
                if (this.isAllowedCategory(category, projectConfiguration)
                        && (!category.parentCategory
                            || !this.isAllowedCategory(category.parentCategory, projectConfiguration))) {
                    this.toplevelCategoriesArray.push(category);
                }
            }
        }
    }


    private createRelations(): Relations {

        const relations: Relations = {};
        relations['isRecordedIn'] = this.isRecordedIn
            ? [this.isRecordedIn.resource.id]
            : [];

        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];
        return relations;
    }


    private isAllowedCategory(category: Category, projectConfiguration: ProjectConfiguration): boolean {

        if (category.name === 'Image') return false;

        if (this.isRecordedIn) {
            if (!projectConfiguration.isAllowedRelationDomainCategory(category.name,
                this.isRecordedIn.resource.category, 'isRecordedIn')) {
                return false;
            }
        } else {
            if (!(this.viewFacade.isInOverview()
                    ? ProjectCategories.getOverviewCategories(this.projectConfiguration.getCategoryForest()).includes(category.name)
                    : ProjectCategories.getTypeCategoryNames().includes(category.name))) {
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
