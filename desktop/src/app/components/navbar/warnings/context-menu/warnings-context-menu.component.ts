import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ContextMenuOrientation } from '../../../widgets/context-menu';
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
export class WarningsContextMenuComponent implements OnChanges {

    @Input() contextMenu: WarningsContextMenu;

    @Output() onSelectAction: EventEmitter<WarningsContextMenuAction> = new EventEmitter<WarningsContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';


    public selectAction = (action: WarningsContextMenuAction) => this.onSelectAction.emit(action);

    public getBottomPosition = (yPosition: number) => WarningsContextMenu.getBottomPosition(yPosition);


    ngOnChanges() {

        this.orientation = WarningsContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public areOptionsAvailable(): boolean {

        return !this.contextMenu.document?.warnings.unconfiguredCategory
            && !this.contextMenu.document?.warnings.missingOrInvalidParent;
    }
}
