import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {BaseList} from '../base-list';
import {ResourcesComponent} from '../resources.component';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Loading} from '../../widgets/loading';
import {ContextMenu} from '../widgets/context-menu';
import {ContextMenuAction} from '../widgets/context-menu.component';


@Component({
    selector: 'type-list',
    moduleId: module.id,
    templateUrl: './type-list.html',
    host: { '(window:contextmenu)': 'handleClick($event, true)' }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeListComponent extends BaseList {

    @Input() documents: Array<FieldDocument>;

    public contextMenu: ContextMenu = new ContextMenu();


    constructor(resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading) {

        super(resourcesComponent, viewFacade, loading);

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (!this.contextMenu.document) return;
        const document: FieldDocument = this.contextMenu.document;

        this.contextMenu.close();

        switch (action) {
            case 'edit':
                await this.resourcesComponent.editDocument(document);
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument(document);
                break;
        }
    }


    public handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        let target = event.target;
        let inside: boolean = false;

        do {
            if (target.id === 'context-menu'
                || (rightClick && target.id && target.id === 'type-list')) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.contextMenu.close();
    }
}