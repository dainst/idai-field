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

        this.viewFacade.setNavigationPath(
            (document)
                ? {
                    elements: NavigationService.rebuildElements(
                        this.viewFacade.getNavigationPath(), document),
                    rootDocument: document
                }
                : { elements: this.viewFacade.getNavigationPath().elements }
        );
    }


    private static rebuildElements(path: NavigationPath, newRoot: IdaiFieldDocument) {

        return (path.elements.indexOf(newRoot) !== -1) ?
            path.elements :

            (!path.rootDocument) ?
                [newRoot] :
                this.makeNewElements(path, newRoot);
    }


    private static makeNewElements(path: NavigationPath, newRoot: IdaiFieldDocument) {

        return FPUtil.takeUntil(
                path.elements, _ => _ == path.rootDocument)

            .concat([newRoot])
    }
}
