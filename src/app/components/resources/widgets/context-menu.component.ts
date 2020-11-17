import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ResourcesComponent} from '../resources.component';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {ContextMenu} from './context-menu';
import {ProjectCategories} from '../../../core/configuration/project-categories';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';


export type ContextMenuAction = 'edit'|'move'|'delete'|'create-polygon'|'create-line-string'
    |'create-point'|'edit-geometry';

type ContextMenuOrientation = 'top'|'bottom';


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


    constructor(private resourcesComponent: ResourcesComponent,
                private viewFacade: ViewFacade,
                private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        this.orientation = ContextMenuComponent.computeOrientation(this.contextMenu.position?.y);
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
    }


    public isEditOptionAvailable(): boolean {

        return !this.isReadonly();
    }


    public isDeleteOptionAvailable(): boolean {

        return !this.isReadonly();
    }


    public isCreateGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.document !== undefined
            && ProjectCategories.isGeometryCategory(
                this.projectConfiguration.getCategoryTreelist(), this.contextMenu.document.resource.category)
            && !this.contextMenu.document.resource.geometry;
    }


    public isEditGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.document !== undefined
            && ProjectCategories.isGeometryCategory(
                this.projectConfiguration.getCategoryTreelist(), this.contextMenu.document.resource.category)
            && this.contextMenu.document.resource.geometry !== undefined;
    }


    public isMoveOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        if (!this.contextMenu.document) return false;

        return this.projectConfiguration
            .getHierarchyParentCategories(this.contextMenu.document.resource.category).length > 0;
    }


    private isReadonly() {

        return this.contextMenu.document['readonly'] === true; // TODO add readonly const to document
    }


    private static computeOrientation(yPosition?: number): ContextMenuOrientation {

        return !yPosition || yPosition <= window.innerHeight * 0.6
            ? 'top'
            : 'bottom';
    }
}
