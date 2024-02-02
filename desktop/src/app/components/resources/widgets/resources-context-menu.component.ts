import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { to } from 'tsfun';
import { FieldDocument, Named, ProjectConfiguration, CategoryForm } from 'idai-field-core';
import { ResourcesContextMenu } from './resources-context-menu';
import { ContextMenuOrientation } from '../../widgets/context-menu';
import { MoveUtility } from '../actions/move/move-utility';


export type ResourcesContextMenuAction = 'edit'|'move'|'delete'|'warnings'|'edit-qr-code'|'edit-images'
    |'create-polygon'|'create-line-string'|'create-point'|'edit-geometry';


@Component({
    selector: 'resources-context-menu',
    templateUrl: './resources-context-menu.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesContextMenuComponent implements OnChanges {

    @Input() contextMenu: ResourcesContextMenu;
    @Input() showViewOption: boolean = false;

    @Output() onSelectAction: EventEmitter<ResourcesContextMenuAction>
        = new EventEmitter<ResourcesContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';
    

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public selectAction = (action: ResourcesContextMenuAction) => this.onSelectAction.emit(action);

    public getBottomPosition = (yPosition: number) => ResourcesContextMenu.getBottomPosition(yPosition);


    ngOnChanges() {

        this.orientation = ResourcesContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public areAnyOptionsAvailable(): boolean {

        return this.isDeleteOptionAvailable()
            || this.isEditOptionAvailable()
            || this.isCreateGeometryOptionAvailable()
            || this.isEditGeometryOptionAvailable()
            || this.isMoveOptionAvailable()
            || this.isEditImagesOptionAvailable()
            || this.isWarningsOptionAvailable()
            || this.isAddQRCodeOptionAvailable()
            || this.isEditQRCodeOptionAvailable();
    }


    public isEditImagesOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isEditOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isDeleteOptionAvailable(): boolean {

        return this.contextMenu.documents.length > 0
            && (!this.isReadonly() || this.isTypeResource());
    }


    public isWarningsOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1
            && this.contextMenu.documents[0].warnings !== undefined;
    }


    public isCreateGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.documents.length === 1
            && this.projectConfiguration.isGeometryCategory(
                this.contextMenu.documents[0].resource.category)
            && !this.contextMenu.documents[0].resource.geometry;
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
            this.contextMenu.documents as Array<FieldDocument>, this.projectConfiguration
        ).length > 0;
    }


    public isAddQRCodeOptionAvailable(): boolean {

        return this.isQrCodeOptionAvailable()
            && !this.contextMenu.documents[0].resource.scanCode;
    }

    
    public isEditQRCodeOptionAvailable(): boolean {

        return this.isQrCodeOptionAvailable()
            && this.contextMenu.documents[0].resource.scanCode;
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


    private isTypeManagementResource(): boolean {

        return this.isCategoryResource(this.projectConfiguration.getTypeManagementCategories());
    }


    private isTypeResource(): boolean {

        return this.isCategoryResource(this.projectConfiguration.getTypeCategories());
    }


    private isCategoryResource(categories: Array<CategoryForm>): boolean {

        return categories.map(to(Named.NAME))
            .includes(this.contextMenu.documents[0].resource.category);
    }
}
