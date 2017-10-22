import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {ImageTypeUtility} from '../../docedit/image-type-utility';
import {ViewFacade} from '../view/view-facade';
import {Loading} from '../../widgets/loading';
import {GeneralRoutingHelper} from '../../common/general-routing-helper';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class RoutingHelper {

    private currentRoute;


    constructor(private router: Router,
                private viewFacade: ViewFacade,
                private location: Location,
                private imageTypeUtility: ImageTypeUtility,
                private loading: Loading,
                private generalRoutingHelper: GeneralRoutingHelper
    ) {
    }


    public routeParams(route: ActivatedRoute) {

        return Observable.create(observer => {
            this.setRoute(route, observer);
        });
    }


    private setRoute(route: ActivatedRoute, observer) { // we need a setter because the route must come from the componenent it is bound to

        route.params.subscribe(params => {

            this.currentRoute = undefined;
            if (params['view']) this.currentRoute = 'resources/' + params['view'];

            this.location.replaceState('resources/' + params['view']);

            this.loading.start();
            this.viewFacade.setupView(params['view'], params['id'])
                .then(() => {this.loading.stop(); observer.next(params);})
                .catch(msgWithParams => {
                    if (msgWithParams) console.error(
                        "got msgWithParams in GeneralRoutingHelper#setRoute: ",msgWithParams);
                });
            }
        );
    }


    public jumpToRelationTarget(selectedDocument, documentToSelect: Document, cb, tab?: string) {

        if (this.imageTypeUtility.isImageType(documentToSelect.resource.type)) {
            this.jumpToImageTypeRelationTarget(selectedDocument, documentToSelect);
        } else {
            this.jumpToResourceTypeRelationTarget(cb, documentToSelect, tab);
        }
    }


    public jumpToImageTypeRelationTarget(selectedDocument: Document, documentToSelect: Document) {

        if (this.currentRoute && selectedDocument.resource && selectedDocument.resource.id) {
            this.currentRoute += '/' + selectedDocument.resource.id + '/show/images';
        }
        this.router.navigate(
            ['images', documentToSelect.resource.id, 'show', 'relations'],
            { queryParams: { from: this.currentRoute } }
        );
    }


    public async jumpToResourceTypeRelationTarget(cb, documentToSelect: Document, tab?: string) {

        const viewName = await this.viewFacade.getMainTypeHomeViewName(
            await this.generalRoutingHelper.getMainTypeNameForDocument(documentToSelect));

        if (viewName != this.viewFacade.getViewName()) {
            if (tab) {
                return this.router.navigate(['resources', viewName,
                    documentToSelect.resource.id, 'view', tab]);
            } else {
                return this.router.navigate(['resources', viewName,
                    documentToSelect.resource.id]);
            }
        } else {
            cb(documentToSelect);
        }
    }


    public jumpToMainTypeHomeView(document: Document) {

        const viewName = this.viewFacade.getMainTypeHomeViewName(document.resource.type);
        if (viewName == this.viewFacade.getViewName()) return;

        this.router.navigate(['resources', viewName, document.resource.id]);
    }
}