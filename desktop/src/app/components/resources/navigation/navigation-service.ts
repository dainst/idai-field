import { Observable, Observer } from 'rxjs';
import { Document, ProjectConfiguration, FieldDocument, CategoryForm, ObserverUtil } from 'idai-field-core';
import { ViewFacade } from '../view/view-facade';
import { Routing } from '../../../services/routing';
import { Messages } from '../../messages/messages';


/**
 * This serves to centralize the behaviour of navigation buttons of both the sidebar as well as the
 * full scale list.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationService {

    private moveIntoObservers: Array<Observer<any>> = [];

    constructor(private projectConfiguration: ProjectConfiguration,
                private routingService: Routing,
                private viewFacade: ViewFacade,
                private messages: Messages) {
    }


    public moveIntoNotifications = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.moveIntoObservers);


    public async jumpToView(document: FieldDocument) {

        await this.routingService.jumpToOperationView(document);
    }


    public shouldShowArrowTopRight(document: FieldDocument) {

        return this.showJumpToViewOption(document);
    }


    public async moveInto(document: FieldDocument|undefined) {

        await this.viewFacade.moveInto(document);
        ObserverUtil.notify(this.moveIntoObservers, undefined);
    }


    public async jumpToResourceInSameView(document: FieldDocument) { // arrow up

        await this.viewFacade.setExtendedSearchMode(false);

        try {
            await this.routingService.jumpToResource(document);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async jumpToResourceFromOverviewToOperation(document: FieldDocument) { // arrow top right, when in search

        try {
            await this.routingService.jumpToResource(document);
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        await this.viewFacade.setExtendedSearchMode(false);
    }


    public shouldShowArrowBottomRight(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.isInExtendedSearchMode()) return false;

        return (this.projectConfiguration
            .getRelationsForRangeCategory(document.resource.category)
            .map(relationDefinition => relationDefinition.name)
            .indexOf('liesWithin') !== -1);
    }


    public shouldShowArrowTopRightForSearchMode(document: FieldDocument) {

        return (this.viewFacade.isInOverview() && this.viewFacade.isInExtendedSearchMode()
            && (!this.projectConfiguration.isSubcategory(document.resource.category, 'Operation')
                && !this.projectConfiguration.isSubcategory(document.resource.category, 'Place')));
    }


    public shouldShowArrowUpForSearchMode(document: FieldDocument) {

        return (!this.viewFacade.isInOverview() && this.viewFacade.isInExtendedSearchMode())
            || (this.viewFacade.isInOverview() && this.viewFacade.isInExtendedSearchMode()
                && (this.projectConfiguration.isSubcategory(document.resource.category, 'Operation')
                    || this.projectConfiguration.isSubcategory(document.resource.category, 'Place'))
            );
    }


    private showJumpToViewOption(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.isInExtendedSearchMode()) return false;

        const operationCategory: CategoryForm|undefined
            = this.projectConfiguration.getCategory('Operation');

        return operationCategory !== undefined && operationCategory.children !== undefined
            && operationCategory.children
                .map(category => category.name)
                .includes(document.resource.category);
    }
}
