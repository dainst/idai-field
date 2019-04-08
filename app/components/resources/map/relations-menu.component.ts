import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ViewFacade} from '../view/view-facade';
import {ResourcesComponent} from '../resources.component';
import {ResourcesMapComponent} from './resources-map.component';
import {SidebarListComponent} from './list/sidebar-list.component';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {RoutingService} from '../../routing-service';


export type ContextMenuAction = 'edit'|'move'|'delete'|'create-polygon'|'create-line-string'|'create-point'|'edit-geometry';


@Component({
    selector: 'relations-menu',
    moduleId: module.id,
    templateUrl: './relations-menu.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RelationsMenuComponent {

    @Input() position: { x: number, y: number };

    @Output() onSelectAction: EventEmitter<ContextMenuAction> = new EventEmitter<ContextMenuAction>();

    public relationsToHide: string[] = ['isRecordedIn', 'liesWithin'];


    constructor(
        public resourcesMapComponent: ResourcesMapComponent,
        public resourcesComponent: ResourcesComponent,
        private routingService: RoutingService,
        public viewFacade: ViewFacade) {}



    public async jumpToResource(documentToSelect: FieldDocument) {

        this.resourcesMapComponent.closeRelationsMenu();
        await this.routingService.jumpToResource(documentToSelect, 'relations');
        this.resourcesComponent.setScrollTarget(documentToSelect);
    }


    public selectAction(action: ContextMenuAction) {

        this.onSelectAction.emit(action);
    }
}