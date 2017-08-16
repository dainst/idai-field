import {Component, ElementRef, Input} from '@angular/core';
import {ConfigLoader} from 'idai-components-2/configuration';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {Imagestore} from '../imagestore/imagestore';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {ImagePickerComponent} from '../widgets/image-picker.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';

@Component({
    selector: 'document-edit-image-tab',
    moduleId: module.id,
    templateUrl: './docedit-image-tab.html'
})

/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class DoceditImageTabComponent {

    @Input() document: IdaiFieldDocument;

    private imageDocuments: IdaiFieldImageDocument[];
    private imageGridBuilder: ImageGridBuilder;
    private rows = [];

    constructor(
        private configLoader: ConfigLoader,
        private imagestore: Imagestore,
        private el: ElementRef,
        private messages: Messages,
        private datastore: IdaiFieldDatastore,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
        this.imageGridBuilder = new ImageGridBuilder(imagestore, true);
    }

    ngOnChanges() {

        this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            if (!this.document) return;
            if (this.document.resource.relations['isDepictedIn']) {
                this.loadImages();
            }
        });
    }

    private calcGrid() {

        this.rows = [];
        this.imageGridBuilder.calcGrid(
            this.imageDocuments, 3, this.el.nativeElement.children[0].clientWidth)
            .then(result => {
                this.rows = result['rows'];

                if (result['msgWithParams']) {
                    for (let msgWithParams of result['msgsWithParams']) {
                        this.messages.add(msgWithParams);
                    }
                }
            });
    }

    private loadImages() {

        const imageDocPromises = [];
        this.imageDocuments = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises).then(docs => {
            this.imageDocuments = docs as Array<IdaiFieldImageDocument>;
            this.calcGrid();
        });
    }

    private addIsDepictedInRelations(imageDocuments: IdaiFieldImageDocument[]) {

        const relations = this.document.resource.relations['isDepictedIn']
            ? this.document.resource.relations['isDepictedIn'].slice() : [];

        for (let i in imageDocuments) {
            if (relations.indexOf(imageDocuments[i].resource.id) == -1) {
                relations.push(imageDocuments[i].resource.id);
            }
        }

        this.document.resource.relations['isDepictedIn'] = relations;

        this.loadImages();
    }

    public onResize() {

        this.calcGrid();
    }

    public openImagePicker() {

        let imagePickerModal = this.modalService.open(ImagePickerComponent, { size: 'lg' });
        imagePickerModal.componentInstance.setDocument(this.document);

        imagePickerModal.result.then(
            (selectedImages: Array<IdaiFieldImageDocument>) => {
                this.addIsDepictedInRelations(selectedImages);
                this.documentEditChangeMonitor.setChanged();
            }
        ).catch(() => {
            // Cancel
        });
    }
}