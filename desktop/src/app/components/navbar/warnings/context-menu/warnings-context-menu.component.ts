import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Warnings, WarningsManager } from 'idai-field-core';
import { WarningsContextMenu } from './warnings-context-menu';


export type WarningsContextMenuAction = 'view'|'edit';


@Component({
    selector: 'warnings-context-menu',
    templateUrl: './warnings-context-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WarningsContextMenuComponent {

    @Input() contextMenu: WarningsContextMenu;

    @Output() onSelectAction: EventEmitter<WarningsContextMenuAction> = new EventEmitter<WarningsContextMenuAction>();


    constructor(private warningsManager: WarningsManager) {}


    public selectAction = (action: WarningsContextMenuAction) => this.onSelectAction.emit(action);

    public getBottomPosition = (yPosition: number) => WarningsContextMenu.getBottomPosition(yPosition);


    public areOptionsAvailable(): boolean {

        const warnings: Warnings = this.warningsManager.get(this.contextMenu.document);

        return !warnings?.unconfiguredCategory
            && !warnings?.missingOrInvalidParent;
    }
}
