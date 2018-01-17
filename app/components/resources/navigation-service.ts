import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {RoutingService} from '../routing-service';
import {ViewFacade} from './view/view-facade';
import {NavigationPath} from './navigation-path';
import {FPUtil} from "../../util/fp-util";


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
            this.setRoot(document);
        }
    }


    public showMoveIntoOption(document: IdaiFieldDocument): boolean {

        if (this.viewFacade.isInOverview()) return true;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any) // TODO make that it does never return undefined
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }


    private setRoot(document: IdaiFieldDocument) {

        this.viewFacade.setNavigationPath(
            (document)
                ? {
                    elements: NavigationService.rebuildElements(
                        this.viewFacade.getNavigationPath().elements,
                        this.viewFacade.getNavigationPath().rootDocument,
                        document),
                    rootDocument: document
                }
                : {
                    elements: this.viewFacade.getNavigationPath().elements
                }
        );
    }


    private static rebuildElements(
        oldElements: Array<IdaiFieldDocument>,
        oldRoot: IdaiFieldDocument|undefined,
        newRoot: IdaiFieldDocument) {

        if (oldElements.indexOf(newRoot) !== -1) return oldElements;

        return ((oldRoot)
                    ? FPUtil.takeUntil(oldElements, _ => _ == oldRoot)
                    : []
                ).concat([newRoot]);
    }

}
