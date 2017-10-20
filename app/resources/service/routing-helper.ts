import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {ImageTypeUtility} from '../../docedit/image-type-utility';
import {ViewFacade} from '../view/view-facade';
import {Loading} from '../../widgets/loading';

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
                private loading: Loading) {
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

            this.viewFacade.setupView(params['view'], params['id'])
                .then(() => this.initializeViewFacade())
                .then(() => {observer.next(params);})
                .catch(msgWithParams => {
                    if (msgWithParams) console.error(
                        "got msgWithParams in RoutingHelper#setRoute: ",msgWithParams);
                });
            }
        );
    }


    private initializeViewFacade(): Promise<any> {

        this.viewFacade.deselect();

        this.loading.start();
        return Promise.resolve()
            .then(() => this.viewFacade.populateProjectDocument())
            .then(() => this.viewFacade.populateOperationTypeDocuments())
            .then(() => this.viewFacade.populateDocumentList())
            .then(() => this.loading.stop());
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


    public jumpToResourceTypeRelationTarget(cb, documentToSelect: Document, tab?: string) {
        // TODO do it inside viewFacade, in order to get rid of getView()
        this.viewFacade.getViewNameForDocument(documentToSelect)
            .then(viewName => {
                if (viewName != this.viewFacade.getView().name) {
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
            });
    }


    public jumpToMainTypeHomeView(document: Document) {
        // TODO do it inside viewFacade, in order to get rid of getView()
        const viewName = this.viewFacade.getOperationTypeHomeViewName(document.resource.type)
        if (viewName == this.viewFacade.getView().name) return;

        this.router.navigate(['resources', viewName, document.resource.id]).then(() => {
            this.viewFacade.selectMainTypeDocument(document);
            this.viewFacade.populateDocumentList();
        });

    }
}