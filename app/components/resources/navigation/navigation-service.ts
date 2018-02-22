import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../state/view-facade';


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
        if (document.resource.type === 'Place') return false; // TODO check if place is hardcoded, and if not, do so
        if (this.viewFacade.isInOverview()) return true;

        return ((this.projectConfiguration
            // TODO split into two functions or do something else to make more clear that we want target type relations
            .getRelationDefinitions(document.resource.type, true) as any) // TODO make that it does never return undefined
            .map((_: RelationDefinition) => _.name) // TODO make toName function and make a util where similar methods are placed, like toDocument for example
            .indexOf('liesWithin') !== -1); // TODO check if liesWithin is hardcoded, and if not, do so
    }
}


