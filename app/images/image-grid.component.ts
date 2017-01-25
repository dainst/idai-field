import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {Datastore, Query, FilterSet, Mediastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {ConfigLoader} from "idai-components-2/configuration";
import {DomSanitizer} from "@angular/platform-browser";
import {ImageGridBuilder} from "./image-grid-builder";
import {ImageTool} from "../common/image-tool";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LinkModalComponent} from "./link-modal.component";
import {FilterUtility} from "../util/filter-utility";
import {BlobProxy} from "../common/blob-proxy";
import {ElementRef} from "@angular/core";

@Component({
    moduleId: module.id,
    templateUrl: './image-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class ImageGridComponent {

    private imageGridBuilder : ImageGridBuilder;
    private imageTool : ImageTool;

    private query : Query = { q: '' };
    private documents: IdaiFieldImageDocument[];
    private defaultFilterSet: FilterSet;

    private nrOfColumns = 4;
    private rows = [];
    private selected: IdaiFieldImageDocument[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        private mediastore: Mediastore,
        sanitizer: DomSanitizer,
        configLoader: ConfigLoader,
        private el : ElementRef
    ) {
        this.imageTool = new ImageTool();
        this.imageGridBuilder = new ImageGridBuilder(
            new BlobProxy(mediastore, sanitizer), true);

        var defaultFilterSet = {
            filters: [{field: 'type', value: 'image', invert: false}],
            type: 'or'
        };

        configLoader.configuration().subscribe(result => {
            if (!this.defaultFilterSet) {
                this.defaultFilterSet =
                    FilterUtility.addChildTypesToFilterSet(defaultFilterSet, result.projectConfiguration.getTypesMap());
                this.query = {q: '', filterSets: [this.defaultFilterSet]};
                this.fetchDocuments(this.query);
            }
        });
    }

    public refreshGrid() {
        this.fetchDocuments(this.query);
    }

    public showUploadErrorMsg(msgWithParams) {
        this.messages.addWithParams(msgWithParams);
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {
        this.query = query;

        this.datastore.find(query).then(documents => {
            this.documents = documents as IdaiFieldImageDocument[];

            // insert stub document for first cell that will act as drop area for uploading images
            this.documents.unshift(<IdaiFieldImageDocument>{
                id: 'droparea',
                resource: { identifier: '', type: '', width: 1, height: 1, filename: '', relations: {} },
                synced: 0
            });

            this.calcGrid();

        }).catch(err => console.error(err));
    }

    public queryChanged(query: Query) {

        this.query = query;
        this.fetchDocuments(query);
    }

    public onResize() {
        this.calcGrid();
    }

    private calcGrid() {
        this.rows = [];
        this.imageGridBuilder.calcGrid(
            this.documents,this.nrOfColumns, this.el.nativeElement.children[0].clientWidth).then(result=>{
            this.rows = result['rows'];
            for (var msgWithParams of result['msgsWithParams']) {
                this.messages.addWithParams(msgWithParams);
            }
        });
    }

    /**
     * @param documentToSelect the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {
        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }

    /**
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldImageDocument) {
        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }

    public clearSelection() {
        this.selected = [];
    }

    public openDeleteModal(modal) {
        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.deleteSelected();
        });
    }

    private deleteSelected() {
        var results = this.selected.map(document => this.imageTool.remove(document, this.mediastore, this.datastore).catch(err=>{
            this.messages.add(err);
        }));
        Promise.all(results).then(() => {
            this.clearSelection();
            this.fetchDocuments(this.query);
        }).catch(error => {
            this.messages.add(error);
        });
    }

    public openLinkModal() {
        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.imageTool.updateAndPersistDepictsRelations(this.selected, targetDoc, this.datastore).then(() => {
                    this.clearSelection();
                }).catch(error => {
                    this.messages.add(error);
                });
            }
        }, (closeReason) => {
        });
    }
}
