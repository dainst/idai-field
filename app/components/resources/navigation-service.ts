import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {RoutingService} from '../routing-service';
import {ViewFacade} from './state/view-facade';


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

        if (this.viewFacade.isInOverview()) return true;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any) // TODO make that it does never return undefined
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }
}


