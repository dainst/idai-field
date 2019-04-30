import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition, FieldDocument, IdaiType, Document} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../view/view-facade';
import {ObserverUtil} from '../../../core/util/observer-util';
import {Observable, Observer} from 'rxjs';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationService {

    private moveIntoObservers: Array<Observer<any>> = [];

    constructor(private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService,
                private viewFacade: ViewFacade) {
    }


    public moveIntoNotifications = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.moveIntoObservers);


    public async moveInto(document: FieldDocument|undefined) {

        await this.viewFacade.moveInto(document);
        ObserverUtil.notify(this.moveIntoObservers, undefined);
    }


    public async jumpToView(document: FieldDocument) {

        await this.routingService.jumpToOperationView(document);
    }


    public async jumpToMatrix(document: FieldDocument) {

        await this.routingService.jumpToMatrix(document);
    }


    public showMoveIntoOption(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.getBypassHierarchy()) return false;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any)
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }


    public shouldShowArrowTopRightForTrench(document: FieldDocument) {

        return this.showJumpToViewOption(document) && document.resource.type === 'Trench';
    }


    public shouldShowArrowTopRight(document: FieldDocument) {

        return this.showJumpToViewOption(document) && document.resource.type !== 'Trench';
    }


    private showJumpToViewOption(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.getBypassHierarchy()) return false;

        return this.projectConfiguration.getTypesMap()['Operation'].children
            .map((type: IdaiType) => type.name)
            .includes(document.resource.type);
    }
}
