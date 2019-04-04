import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ViewFacade} from '../view/view-facade';
import {ResourcesComponent} from '../resources.component';
import {ResourcesMapComponent} from './resources-map.component';


export type ContextMenuAction = 'edit'|'move'|'delete'|'create-polygon'|'create-line-string'|'create-point'|'edit-geometry';


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


    constructor(
        public resourcesMapComponent: ResourcesMapComponent,
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade) {}


    public selectAction(action: ContextMenuAction) {

        this.onSelectAction.emit(action);
    }
}