import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Imagestore} from '../imagestore/imagestore';
import {DoceditComponent} from '../docedit/docedit.component';
import {ObjectUtil} from '../util/object-util';
import {BlobMaker} from '../imagestore/blob-maker';
import {ImageContainer} from '../imagestore/image-container';
import {DoceditActiveTabService} from '../docedit/docedit-active-tab-service';
import {M} from '../m';
import {ViewFacade} from '../resources/view/view-facade';
import {GeneralRoutingHelper} from '../common/general-routing-helper';
import {Document} from 'idai-components-2/core';


@Component({
    moduleId: module.id,
    templateUrl: './image-view.html'
})
/**
 * @author Daniel de Oliveira
 */
export class ImageViewComponent implements OnInit {


    protected image: ImageContainer = {};
    protected activeTab: string;

    private originalNotFound = false;
    private comingFrom: Array<any>|undefined = undefined;


    constructor(
        private route: ActivatedRoute,
        private datastore: Datastore,
        private imagestore: Imagestore,
        private messages: Messages,
        private router: Router,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private viewFacade: ViewFacade,
        private doceditActiveTabService: DoceditActiveTabService,
        private generalRoutingHelper: GeneralRoutingHelper
    ) {
        this.route.queryParams.subscribe(queryParams => {
            if (queryParams['from']) this.comingFrom = queryParams['from'].split('/');
        });
    }


    ngOnInit() {

        this.fetchDocAndImage();
        window.getSelection().removeAllRanges();
    }


    public async jumpToRelationTarget(documentToJumpTo: IdaiFieldDocument) {

        const viewName = await this.viewFacade
            .getMainTypeHomeViewName(await this.generalRoutingHelper
                .getMainTypeNameForDocument(documentToJumpTo));

        this.router.navigate(['resources', viewName,
            documentToJumpTo.resource.id, 'view', 'images']);
    }


    public deselect() {

        if (this.comingFrom) this.router.navigate(this.comingFrom);
        else this.router.navigate(['images']);
    }


    public startEdit(doc: IdaiFieldDocument, tabName: string) {

        this.doceditActiveTabService.setActiveTab(tabName);

        const doceditModalRef = this.modalService.open(DoceditComponent, {size: 'lg', backdrop: 'static'});
        const doceditModalComponent = doceditModalRef.componentInstance;

        doceditModalRef.result.then(result => {
            if (result.document) this.image.document = result.document;
            this.setNextDocumentViewActiveTab();
        }, closeReason => {
            this.documentEditChangeMonitor.reset();
            if (closeReason == 'deleted') this.deselect();
        });

        doceditModalComponent.setDocument(doc);
    }

    public hasRelations() {

        if (!this.image) return false;
        if (!this.image.document) return false;

        return !ObjectUtil.isEmpty(this.image.document.resource.relations);
    }

    protected fetchDocAndImage() {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.getRouteParams(function(id: string) {
            this.id = id;
            this.datastore.get(id).then(
                (doc: Document) => {
                    this.image.document = doc;
                    // read original (empty if not present)
                    this.imagestore.read(doc.resource.id, false, false)
                        .then((url: any) => {
                            if (!url || url == '') this.originalNotFound = true;
                            this.image.imgSrc = url;
                        })
                        // read thumb
                        .then(() => this.imagestore.read(doc.resource.id, false, true))
                        .then((url: any) => this.image.thumbSrc = url)
                        .catch(() => {
                            this.image.imgSrc = BlobMaker.blackImg;
                            this.messages.add([M.IMAGES_ONE_NOT_FOUND]);
                        });
                },
                () => {
                    console.error("Fatal error: could not load document for id ", id);
                });
        }.bind(this));
    }


    private setNextDocumentViewActiveTab() {

        const nextActiveTab = this.doceditActiveTabService.getActiveTab();
        if (['relations', 'fields'].indexOf(nextActiveTab) != -1) {
            this.activeTab = nextActiveTab;
        }
    }


    private getRouteParams(callback: Function) {

        this.route.params.forEach((params: Params) => {
            this.activeTab = params['tab'];
            callback(params['id']);
        });
    }
}
