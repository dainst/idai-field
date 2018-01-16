import {Injectable} from '@angular/core';
import {RoutingService} from '../routing-service';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ViewFacade} from './view/view-facade';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class NavigationService {

    constructor(private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService,
                private viewFacade: ViewFacade) {
    }


    public moveInto(document: IdaiFieldDocument) {

        if (this.viewFacade.isInOverview()) {
            this.routingService.jumpToMainTypeHomeView(document);
        } else {
            this.setRootDocument(document);
        }
    }


    public showMoveIntoOption(document: IdaiFieldDocument): boolean {

        if (this.viewFacade.isInOverview()) return true;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any) // TODO make that it does never return undefined
            .map((rd: RelationDefinition) => rd.name)
            .indexOf('liesWithin') !== -1);
    }


    private setRootDocument(document: IdaiFieldDocument) {

        const navigationPath = this.viewFacade.getNavigationPath();

        if (document) {
            if (navigationPath.elements.indexOf(document) == -1) navigationPath.elements.push(document);
            navigationPath.rootDocument = document;
        } else {
            delete navigationPath.rootDocument;
        }

        this.viewFacade.setNavigationPath(navigationPath);
    }
}
