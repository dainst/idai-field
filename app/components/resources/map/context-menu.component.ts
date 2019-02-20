import {Component, EventEmitter, Input, Output} from '@angular/core';


export type ContextMenuAction = 'edit'|'move'|'delete';


@Component({
    selector: 'context-menu',
    moduleId: module.id,
    templateUrl: './context-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class ContextMenuComponent {

    @Input() position: { x: number, y: number };

    @Output() onSelectAction: EventEmitter<ContextMenuAction> = new EventEmitter<ContextMenuAction>();


    public selectAction(action: ContextMenuAction) {

        this.onSelectAction.emit(action);
    }
}