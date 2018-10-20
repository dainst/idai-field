import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition, IdaiFieldDocument, IdaiType} from 'idai-components-2';
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

        this.viewFacade.moveInto(document);
    }


    public jumpToView(document: IdaiFieldDocument) {

        this.routingService.jumpToMainTypeHomeView(document);
    }


    public showMoveIntoOption(document: IdaiFieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.getBypassHierarchy()) return false;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any)
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }


    public showJumpToViewOption(document: IdaiFieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.getBypassHierarchy()) return false;

        return this.projectConfiguration.getTypesMap()['Operation'].children
            .map((type: IdaiType) => type.name)
            .includes(document.resource.type);
    }
}
