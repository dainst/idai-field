import {Component, Input, OnChanges} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {BlobMaker} from '../../../../core/imagestore/blob-maker';
import {Imagestore} from '../../../../core/imagestore/imagestore';
import {MenuService} from '../../../../menu-service';
import {ImageViewComponent} from '../../../imageview/image-view.component';
import {ResourcesComponent} from '../../resources.component';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../../core/datastore/idai-field-media-document-read-datastore';
import {IdaiFieldMediaDocument} from '../../../../core/model/idai-field-media-document';


@Component({
    selector: 'thumbnail',
    moduleId: module.id,
    templateUrl: './thumbnail.html'
})
/**
 * @author Thomas Kleinke
 */
export class ThumbnailComponent implements OnChanges {

    @Input() identifier: string;
    @Input() isDepictedInRelations: string[]|undefined;

    public thumbnailUrl: string|undefined;

    private mediaDocuments: Array<IdaiFieldMediaDocument> = [];


    constructor(private imagestore: Imagestore,
                private datastore: IdaiFieldMediaDocumentReadDatastore,
                private modalService: NgbModal,
                private resourcesComponent: ResourcesComponent) {}


    async ngOnChanges() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.isDepictedInRelations);
        this.mediaDocuments = await this.getMediaDocuments(this.isDepictedInRelations);
    }


    public async openImageModal() {

        MenuService.setContext('image-view');
        this.resourcesComponent.isModalOpened = true;

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            this.mediaDocuments,
            this.mediaDocuments[0],
            this.identifier
        );
        await modalRef.result;

        MenuService.setContext('default');
        this.resourcesComponent.isModalOpened = false;
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


    private async getMediaDocuments(relations: string[]|undefined): Promise<Array<IdaiFieldMediaDocument>> {

        return relations
            ? this.datastore.getMultiple(relations)
            : [];
    }
}