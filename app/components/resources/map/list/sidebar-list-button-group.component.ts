import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {SidebarListComponent} from './sidebar-list.component';
import {ViewFacade} from '../../view/view-facade';



@Component({
    selector: 'sidebar-list-button-group',
    moduleId: module.id,
    templateUrl: './sidebar-list-button-group.html'
})
/**
 * @author Daniel de Oliveira
 */

export class SidebarListButtonGroupComponent {

    @Input() document: FieldDocument;

    constructor(public sidebarList: SidebarListComponent,
                public viewFacade: ViewFacade) {
    }
}