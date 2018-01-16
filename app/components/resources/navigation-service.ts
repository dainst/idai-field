import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {RoutingService} from '../routing-service';
import {ViewFacade} from './view/view-facade';
import {NavigationPath} from './navigation-path';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
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
            this.rebuildNavigationPath(navigationPath, document);
            navigationPath.rootDocument = document;
        } else {
            delete navigationPath.rootDocument;
        }

        this.viewFacade.setNavigationPath(navigationPath);
    }


    private rebuildNavigationPath(navigationPath: NavigationPath, newRootDocument: IdaiFieldDocument) {

        if (navigationPath.elements.indexOf(newRootDocument) != -1) return;

        if (!navigationPath.rootDocument) {
            navigationPath.elements = [newRootDocument];
            return;
        }

        const elements: Array<IdaiFieldDocument> = [];

        for (let document of navigationPath.elements) {
            elements.push(document);
            if (document == navigationPath.rootDocument) break;
        }

        elements.push(newRootDocument);
        navigationPath.elements = elements;
    }
}
