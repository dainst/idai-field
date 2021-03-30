import {Component, Input} from '@angular/core';
import {Document} from 'idai-field-core';
import {PopoverMenu, ResourcesComponent} from '../../resources.component';
import {ViewFacade} from '../../../../core/resources/view/view-facade';
import {RoutingService} from '../../../routing-service';
import {ViewModalLauncher} from '../../service/view-modal-launcher';
import { FieldDocument } from 'idai-field-core';


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
    @Input() showThumbnail: boolean = true;


    constructor(private resourcesComponent: ResourcesComponent,
                private viewFacade: ViewFacade,
                private routingService: RoutingService,
                private viewModalLauncher: ViewModalLauncher) {}


    public getExpandAllGroups = () => this.viewFacade.getExpandAllGroups();

    public toggleExpandAllGroups = () => this.viewFacade.toggleExpandAllGroups();

    public disableExpandAllGroups = () => !this.getExpandAllGroups() || this.toggleExpandAllGroups();

    public isPopoverMenuOpened = (menu?: PopoverMenu): boolean => this.resourcesComponent.isPopoverMenuOpened(menu);

    public closePopover = () => this.resourcesComponent.closePopover();

    public hasThumbnail = (document: FieldDocument): boolean => Document.hasRelations(document, 'isDepictedIn');


    public async jumpToResource(document: FieldDocument) {

        await this.routingService.jumpToResource(document);
    }


    public async openImageViewModal() {

        await this.viewModalLauncher.openImageViewModal(this.document)
    }
}
