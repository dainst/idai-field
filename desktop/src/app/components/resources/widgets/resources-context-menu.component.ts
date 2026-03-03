import { Component, EventEmitter, Input, Output } from '@angular/core';
import { to } from 'tsfun';
import { FieldDocument, Named, ProjectConfiguration, CategoryForm, Relation,
    FieldGeometryType } from 'idai-field-core';
import { ResourcesContextMenu } from './resources-context-menu';
import { MoveUtility } from '../../widgets/move-modal/move-utility';
import { UtilTranslations } from '../../../util/util-translations';


export type ResourcesContextMenuAction = 'edit'|'move'|'delete'|'warnings'|'edit-qr-code'|'edit-images'
    |'scan-resource'|'edit-workflow'|'create-polygon'|'create-line-string'|'create-point'|'edit-geometry';


@Component({
    selector: 'resources-context-menu',
    templateUrl: './resources-context-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesContextMenuComponent {

    @Input() contextMenu: ResourcesContextMenu;
    @Input() showViewOption: boolean = false;

    @Output() onSelectAction: EventEmitter<ResourcesContextMenuAction>
        = new EventEmitter<ResourcesContextMenuAction>();
    

    constructor(private projectConfiguration: ProjectConfiguration,
                private utilTranslations: UtilTranslations) {}


    public selectAction = (action: ResourcesContextMenuAction) => this.onSelectAction.emit(action);

    public getBottomPosition = (yPosition: number) => ResourcesContextMenu.getBottomPosition(yPosition);


    public areAnyOptionsAvailable(): boolean {

        return this.isDeleteOptionAvailable()
            || this.isEditOptionAvailable()
            || this.isCreateGeometryOptionAvailable()
            || this.isEditGeometryOptionAvailable()
            || this.isMoveOptionAvailable()
            || this.isEditImagesOptionAvailable()
            || this.isWarningsOptionAvailable()
            || this.isAddQRCodeOptionAvailable()
            || this.isEditQRCodeOptionAvailable()
            || this.isScanResourceOptionIsAvailable()
            || this.isEditWorkflowOptionAvailable();
    }


    public isEditImagesOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isEditOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isDeleteOptionAvailable(): boolean {

        return this.contextMenu.documents.length > 0
            && (!this.isReadonly() || !this.isTypeResource());
    }


    public isWarningsOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1
            && this.contextMenu.documents[0].warnings !== undefined;
    }


    public isCreateGeometryOptionAvailable(geometryType?: FieldGeometryType): boolean {

        if (this.isReadonly()) return false;

        return this.contextMenu.documents.length === 1
            && this.projectConfiguration.isGeometryCategory(
                this.contextMenu.documents[0].resource.category)
            && (!geometryType || CategoryForm.isAllowedGeometryType(
                this.projectConfiguration.getCategory(this.contextMenu.documents[0].resource.category),
                geometryType
            )) && !this.contextMenu.documents[0].resource.geometry;
    }


    public isEditGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.documents.length === 1
            && this.projectConfiguration.isGeometryCategory(
                this.contextMenu.documents[0].resource.category)
            && this.contextMenu.documents[0].resource.geometry !== undefined;
    }


    public isMoveOptionAvailable(): boolean {

        if (this.isReadonly() || this.contextMenu.documents.length === 0) return false;

        return MoveUtility.getAllowedTargetCategories(
            this.contextMenu.documents as Array<FieldDocument>, this.projectConfiguration, this.utilTranslations,
        ).length > 0;
    }


    public isScanResourceOptionIsAvailable(): boolean {

        return this.isScanStoragePlaceOptionIsAvailable()
            || this.isScanTypeOptionIsAvailable();
    }


    public isScanStoragePlaceOptionIsAvailable(): boolean {

        if (this.isReadonly() || !this.isStoredInRelationAllowed()) return false;

        return this.projectConfiguration.getInventoryCategories().filter(category => category.scanCodes).length > 0;
    }


    public isScanTypeOptionIsAvailable(): boolean {

        if (this.isReadonly() || !this.isInstanceOfRelationAllowed()) return false;

        return this.projectConfiguration.getTypeCategories().filter(category => category.scanCodes).length > 0;
    }


    public isAddQRCodeOptionAvailable(): boolean {

        return this.isQrCodeOptionAvailable()
            && !this.contextMenu.documents[0].resource.scanCode;
    }

    
    public isEditQRCodeOptionAvailable(): boolean {

        return this.isQrCodeOptionAvailable()
            && this.contextMenu.documents[0].resource.scanCode;
    }


    public isEditWorkflowOptionAvailable(): boolean {

        const processCategories: Array<CategoryForm> = this.projectConfiguration.getCategory('Process')
            ?.children ?? [];

        return this.contextMenu.documents.length
            && this.contextMenu.documents.find(document => {
                return processCategories.find(category => {
                    return this.projectConfiguration.isAllowedRelationDomainCategory(
                        category.name, document.resource.category, Relation.Workflow.IS_CARRIED_OUT_ON
                    );
                }) !== undefined;
            }) !== undefined;
    }


    private isQrCodeOptionAvailable(): boolean {

        if (!this.isEditOptionAvailable()) return false;

        const category: CategoryForm = this.projectConfiguration.getCategory(
            this.contextMenu.documents[0].resource.category
        );

        return category.scanCodes !== undefined;
    }


    private isReadonly(): boolean {

        return this.contextMenu.documents.find(document => document.project !== undefined) !== undefined;
    }


    private isStoredInRelationAllowed(): boolean {

        return this.contextMenu.documents.every(document => {
            return this.projectConfiguration.isAllowedRelationDomainCategory(
                document.resource.category, 'StoragePlace', Relation.Inventory.ISSTOREDIN
            );
        });
    }


    private isInstanceOfRelationAllowed(): boolean {

        return this.contextMenu.documents.every(document => {
            return this.projectConfiguration.isAllowedRelationDomainCategory(
                document.resource.category, 'Type', Relation.Type.INSTANCEOF
            );
        });
    }


    private isTypeResource(): boolean {

        return this.isCategoryResource(this.projectConfiguration.getTypeCategories());
    }


    private isCategoryResource(categories: Array<CategoryForm>): boolean {

        return categories.map(to(Named.NAME))
            .includes(this.contextMenu.documents[0].resource.category);
    }
}
