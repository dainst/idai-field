import { Component, Input } from '@angular/core';
import { FieldDocument } from 'idai-field-core';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { NavigationService } from '../navigation/navigation-service';
import { ResourcesComponent } from '../resources.component';


@Component({
    selector: 'list-button-group',
    templateUrl: './list-button-group.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ListButtonGroupComponent {

    @Input() document: FieldDocument;
    @Input() isDocumentSelected: boolean;

    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                private navigationService: NavigationService) {}


    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () => this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public jumpToResourceInSameView = () => this.navigationService.jumpToResourceInSameView(this.document);

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);


    public moveInto() {
        
        this.resourcesComponent.popoverMenuOpened = false;
        this.viewFacade.moveInto(this.document);
    }


    public async jumpToResourceFromOverviewToOperation() {

        this.resourcesComponent.popoverMenuOpened = false;
        await this.navigationService.jumpToResourceFromOverviewToOperation(this.document);
    }
}
