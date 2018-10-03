import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../view/view-facade';


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

        this.viewFacade.isInOverview()
            ? this.routingService.jumpToMainTypeHomeView(document)
            : this.viewFacade.moveInto(document);
    }


    public showMoveIntoOption(document: IdaiFieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (document.resource.type === 'Place') return false;
        if (this.viewFacade.getBypassHierarchy()) return false;
        if (this.viewFacade.isInOverview()) return true;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any)
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }
}


