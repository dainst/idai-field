import { Component, Input } from '@angular/core';
import { Document, FieldDocument } from 'idai-field-core';
import { PopoverMenu, ResourcesComponent } from '../../resources.component';
import { ViewFacade } from '../../../../components/resources/view/view-facade';
import { Routing } from '../../../../services/routing';
import { ViewModalLauncher } from '../../../viewmodal/view-modal-launcher';
import { Messages } from '../../../messages/messages';


@Component({
    selector: 'popover-menu',
    templateUrl: './popover-menu.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PopoverMenuComponent {

    @Input() document: FieldDocument;
    @Input() showThumbnail = true;


    constructor(private resourcesComponent: ResourcesComponent,
                private viewFacade: ViewFacade,
                private routingService: Routing,
                private viewModalLauncher: ViewModalLauncher,
                private messages: Messages) {}


    public getExpandAllGroups = () => this.viewFacade.getExpandAllGroups();

    public setExpandAllGroups = (expandAllGroups: boolean) => this.viewFacade.setExpandAllGroups(expandAllGroups);

    public toggleExpandAllGroups = () => this.viewFacade.toggleExpandAllGroups();

    public disableExpandAllGroups = () => !this.getExpandAllGroups() || this.toggleExpandAllGroups();

    public isPopoverMenuOpened = (menu?: PopoverMenu): boolean => this.resourcesComponent.isPopoverMenuOpened(menu);

    public closePopover = () => this.resourcesComponent.closePopover();

    public hasThumbnail = (document: FieldDocument): boolean => Document.hasRelations(document, 'isDepictedIn');


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
