import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ConfigurationContextMenu } from './configuration-context-menu';
import { ContextMenuOrientation } from '../../widgets/context-menu';


export type ConfigurationContextMenuAction = 'edit'|'extend'|'swap'|'delete';


@Component({
    selector: 'configuration-context-menu',
    templateUrl: './configuration-context-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ConfigurationContextMenuComponent implements OnChanges {

    @Input() contextMenu: ConfigurationContextMenu;

    @Output() onSelectAction: EventEmitter<ConfigurationContextMenuAction>
        = new EventEmitter<ConfigurationContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';


    public selectAction = (action: ConfigurationContextMenuAction) => this.onSelectAction.emit(action);

    public getBottomPosition = (yPosition: number) => ConfigurationContextMenu.getBottomPosition(yPosition);


    ngOnChanges() {

        this.orientation = ConfigurationContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public areAnyOptionsAvailable(): boolean {

        return this.isDeleteOptionAvailable()
            || this.isEditOptionAvailable()
            || this.isSwapOptionAvailable()
            || this.isExtendOptionAvailable();
    }


    public isEditOptionAvailable(): boolean {

        if (this.contextMenu.valuelist) return this.contextMenu.valuelist.source === 'custom';

        return true;
    }


    public isExtendOptionAvailable(): boolean {

        return this.contextMenu.valuelist && this.contextMenu.valuelist.source === 'library';
    }


    public isSwapOptionAvailable(): boolean {

        return this.contextMenu.category
            && !this.contextMenu.group
            && !this.contextMenu.field
            && this.contextMenu.category.source !== 'custom';
    }


    public isDeleteOptionAvailable(): boolean {

        if (this.contextMenu.valuelist) return this.contextMenu.valuelist.source === 'custom';

        return (!this.contextMenu.field
            || this.contextMenu.category.customFields.includes(this.contextMenu.field.name))
        && (this.contextMenu.field !== undefined || this.contextMenu.group !== undefined
            || !this.contextMenu.category.required);
    }
}
