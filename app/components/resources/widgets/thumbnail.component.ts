import {Component, Input, OnChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {FieldDocument} from 'idai-components-2';
import {ImageDatastore} from '../../../core/datastore/field/image-datastore';
import {ResourcesComponent} from '../resources.component';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';
import {ViewModalLauncher} from '../service/view-modal-launcher';


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
    @Input() modal: 'image'|'resource' = 'image';

    public thumbnailUrl: SafeResourceUrl|undefined;


    constructor(private imagestore: Imagestore,
                private datastore: ImageDatastore,
                private viewModalLauncher: ViewModalLauncher,
                private resourcesComponent: ResourcesComponent) {}


    public isThumbnailFound = (): boolean => this.thumbnailUrl !== BlobMaker.blackImg;


    async ngOnChanges() {

        await this.updateThumbnailUrl();
    }


    public async openModal() {

        if (this.modal === 'image') {
            await this.viewModalLauncher.openImageViewModal(this.document, this.resourcesComponent)
        } else {
            const edited: boolean = await this.viewModalLauncher.openResourceViewModal(
                this.document, this.resourcesComponent
            );
            if (edited) await this.updateThumbnailUrl();
        }
    }


    private async updateThumbnailUrl() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.document.resource.relations.isDepictedIn);
    }


    private async getThumbnailUrl(relations: string[]|undefined): Promise<SafeResourceUrl|undefined> {

        if (!relations || relations.length === 0) return undefined;

        try {
            return await this.imagestore.read(relations[0], false, true);
        } catch (e) {
            return BlobMaker.blackImg;
        }
    }
}