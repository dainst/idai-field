import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import {on} from 'tsfun';
import {Document, Messages, ImageDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../../imagegrid/image-grid.component';
import {M} from '../../../m';
import {ViewFacade} from '../../view/view-facade';
import {UploadResult} from '../../../upload/upload-result';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../../core/datastore/idai-field-media-document-read-datastore';
import {SortUtil} from '../../../../core/util/sort-util';
import {IdaiFieldMediaDocument} from '../../../../core/model/idai-field-media-document';

@Component({
    selector: 'thumbnail-view',
    moduleId: module.id,
    templateUrl: './thumbnail-view.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ThumbnailViewComponent implements OnInit, OnChanges {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    public documents: Array<IdaiFieldMediaDocument>;

    @Input() document: Document;

    @Output() onRelationTargetClicked: EventEmitter<Document> = new EventEmitter<Document>();

    private updatingGrid: boolean = false;


    constructor(private datastore: IdaiFieldMediaDocumentReadDatastore,
                private messages: Messages,
                private viewFacade: ViewFacade) {}


    ngOnInit() {

        this.viewFacade.populateDocumentsNotifications().subscribe(async () => {
            await this.updateGrid();
        });
    }


    async ngOnChanges() {

        await this.updateGrid();
    }


    public onResize() {

        if (!this.documents || this.documents.length === 0) return;

        this.imageGrid.calcGrid();
    }


    public async onFilesUploaded(uploadResult: UploadResult) {

        // This is small hack to show the updated document, since this.document, which came via viewFacade.getSelectedDocument()
        // is stale and points to the old version of the document. It is stale because there is no proper input for the selectedDocument
        // in DocumentDetailSidebar and hence there is also no onChanges that could be triggered
        const updatedDoc = this.viewFacade.getDocuments().find(on('resource.id')(this.document));
        if (updatedDoc) {
            this.document = updatedDoc;
            // so that other callers (like Docedit) work with the latest version, too
            await this.viewFacade.setSelectedDocument(this.document.resource.id);
        }
        //

        await this.updateGrid();
        this.showUploadResultMessage(uploadResult);
    }


    public clickRelation(document: Document) {

        this.onRelationTargetClicked.emit(document);
    }


    private async updateGrid() {

        if (this.updatingGrid || !Document.hasRelations(this.document, 'isDepictedIn')) return;

        this.updatingGrid = true;

        this.documents = await this.getImageDocuments();
        this.imageGrid.calcGrid();

        this.updatingGrid = false;
    }


    private async getImageDocuments(): Promise<Array<IdaiFieldMediaDocument>> {

        const documents: Array<IdaiFieldMediaDocument> = [];

        for (let id of this.document.resource.relations['isDepictedIn']) {
            documents.push(await this.datastore.get(id));
        }

        documents.sort((a: ImageDocument, b: ImageDocument) => {
            return SortUtil.alnumCompare(a.resource.identifier, b.resource.identifier);
        });

        return documents;
    }
    
    
    private showUploadResultMessage(uploadResult: UploadResult) {


        if (uploadResult.uploadedFiles == 1) {
            this.messages.add([M.RESOURCES_SUCCESS_FILE_UPLOADED, this.document.resource.identifier]);
        } else if (uploadResult.uploadedFiles > 1) {
            this.messages.add([M.RESOURCES_SUCCESS_FILES_UPLOADED, uploadResult.uploadedFiles.toString(),
                this.document.resource.identifier]);
        }
    }
}