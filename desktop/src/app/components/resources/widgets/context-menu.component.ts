import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {ContextMenu, ContextMenuOrientation} from './context-menu';
import {FieldDocument, ProjectCategories} from 'idai-field-core';
import {ProjectConfiguration} from 'idai-field-core';
import {MoveUtility} from '../../../core/resources/move-utility';


export type ContextMenuAction = 'edit'|'move'|'delete'|'edit-images'|'create-polygon'|'create-line-string'
    |'create-point'|'edit-geometry';


@Component({
    selector: 'context-menu',
    templateUrl: './context-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class ContextMenuComponent implements OnChanges {

    @Input() contextMenu: ContextMenu;
    @Input() showViewOption: boolean = false;

    @Output() onSelectAction: EventEmitter<ContextMenuAction> = new EventEmitter<ContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';


    constructor(private viewFacade: ViewFacade,
                private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        this.orientation = ContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public selectAction(action: ContextMenuAction) {

        this.onSelectAction.emit(action);
    }


    public getBottomPosition(yPosition: number): number {

        return window.innerHeight - yPosition;
    }


    public areAnyOptionsAvailable(): boolean {

        return this.isDeleteOptionAvailable()
            || this.isEditOptionAvailable()
            || this.isCreateGeometryOptionAvailable()
            || this.isEditGeometryOptionAvailable()
            || this.isMoveOptionAvailable()
            || this.isEditImagesOptionAvailable();
    }


    // TODO implement properly
    public isEditImagesOptionAvailable(): boolean {

        return true;
    }

    public isEditOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isDeleteOptionAvailable(): boolean {

        return this.contextMenu.documents.length > 0 &&
            (!this.isReadonly() || this.contextMenu.documents[0].resource.category !== 'Type');
    }


    public isCreateGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.documents.length === 1
            && ProjectCategories.isGeometryCategory(
                this.projectConfiguration.getCategoryForest(), this.contextMenu.documents[0].resource.category)
            && !this.contextMenu.documents[0].resource.geometry;
    }


    public isEditGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.documents.length === 1
            && ProjectCategories.isGeometryCategory(
                this.projectConfiguration.getCategoryForest(), this.contextMenu.documents[0].resource.category)
            && this.contextMenu.documents[0].resource.geometry !== undefined;
    }


    public isMoveOptionAvailable(): boolean {

        if (this.isReadonly() || this.contextMenu.documents.length === 0) return false;

        return MoveUtility.getAllowedTargetCategories(
            this.contextMenu.documents as Array<FieldDocument>, this.projectConfiguration, this.viewFacade.isInOverview()
        ).length > 0;
    }


    private isReadonly(): boolean {

        return this.contextMenu.documents.find(document => document.project !== undefined) !== undefined;
    }
}
