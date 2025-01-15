import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FieldDocument } from 'idai-field-core';
import { ResourcesComponent } from '../resources.component';
import { ViewFacade } from '../view/view-facade';
import { Routing } from '../../../services/routing';
import { ViewModalLauncher } from '../../viewmodal/view-modal-launcher';
import { Messages } from '../../messages/messages';


@Component({
    selector: 'popover-menu',
    templateUrl: './popover-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PopoverMenuComponent {

    @Input() document: FieldDocument;
    @Input() showThumbnail: boolean = true;

    @Output() onDocumentInfoHeaderRightClicked: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();


    constructor(private resourcesComponent: ResourcesComponent,
                private viewFacade: ViewFacade,
                private routingService: Routing,
                private viewModalLauncher: ViewModalLauncher,
                private messages: Messages) {}


    public getExpandAllGroups = () => this.viewFacade.getExpandAllGroups();

    public setExpandAllGroups = (expandAllGroups: boolean) => this.viewFacade.setExpandAllGroups(expandAllGroups);

    public isPopoverMenuOpened = () => this.resourcesComponent.popoverMenuOpened;

    public closePopover = () => this.resourcesComponent.popoverMenuOpened = false;

    public isInExtendedSearchMode = () => this.viewFacade.isInExtendedSearchMode();


    public async jumpToResource(document: FieldDocument) {

        try {
            await this.routingService.jumpToResource(document);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openImageViewModal() {

        await this.viewModalLauncher.openImageViewModal(this.document, 'view');
    }
}
