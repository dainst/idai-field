import {Component, Input, OnChanges} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ImageDocument, FieldDocument} from 'idai-components-2';
import {BlobMaker} from '../../../../core/imagestore/blob-maker';
import {Imagestore} from '../../../../core/imagestore/imagestore';
import {MenuService} from '../../../../menu-service';
import {ImageViewComponent} from '../../../imageview/image-view.component';
import {ImageDatastore} from '../../../../core/datastore/field/image-datastore';


@Component({
    selector: 'thumbnail',
    moduleId: module.id,
    templateUrl: './thumbnail.html'
})
/**
 * @author Thomas Kleinke
 */
export class ThumbnailComponent implements OnChanges {

    @Input() document: FieldDocument;

    public thumbnailUrl: string|undefined;

    private images: Array<ImageDocument> = [];


    constructor(private imagestore: Imagestore,
                private datastore: ImageDatastore,
                private modalService: NgbModal) {}


    async ngOnChanges() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.document.resource.relations['isDepictedIn']);
        this.images = await this.getImageDocuments(this.document.resource.relations['isDepictedIn']);
    }


    public async openImageModal() {

        MenuService.setContext('image-view');

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            this.images,
            this.images[0],
            this.document
        );
        await modalRef.result;

        MenuService.setContext('default');
    }


    private async getThumbnailUrl(relations: string[]|undefined): Promise<string|undefined> {

        if (!relations || relations.length === 0) return undefined;

        try {
            return this.imagestore.read(
                relations[0], false, true
            );
        } catch (e) {
            return BlobMaker.blackImg;
        }
    }


    private async getImageDocuments(relations: string[]|undefined): Promise<Array<ImageDocument>> {

        return relations
            ? this.datastore.getMultiple(relations)
            : [];
    }
}