import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ConfigurationContextMenu } from './configuration-context-menu';
import { ContextMenuOrientation } from '../../widgets/context-menu';
import { ConfigurationUtil } from '../../../components/configuration/configuration-util';


export type ConfigurationContextMenuAction = 'edit'|'swap'|'delete';


@Component({
    selector: 'configuration-context-menu',
    templateUrl: './configuration-context-menu.html'
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
            || this.isEditOptionAvailable();
    }


    public isEditOptionAvailable(): boolean {

        return !this.contextMenu.group
            || (this.contextMenu.group && ConfigurationUtil.isEditableGroup(this.contextMenu.group));
    }


    public isSwapOptionAvailable(): boolean {

        return !this.contextMenu.group
            && !this.contextMenu.field
            && this.contextMenu.category.source !== 'custom';
    }


    public isDeleteOptionAvailable(): boolean {

        return (!this.contextMenu.field
                || this.contextMenu.category.customFields.includes(this.contextMenu.field.name))
            && (this.contextMenu.field !== undefined || this.contextMenu.group !== undefined
                || !this.contextMenu.category.required);
    }
}
