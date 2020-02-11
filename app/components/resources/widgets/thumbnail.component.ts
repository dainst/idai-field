import {Component, Input, OnChanges} from '@angular/core';
import {FieldResource} from 'idai-components-2';
import {ImageDatastore} from '../../../core/datastore/field/image-datastore';
import {ResourcesComponent} from '../resources.component';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';
import {ImageModalLauncher} from '../service/image-modal-launcher';


@Component({
    selector: 'thumbnail',
    moduleId: module.id,
    templateUrl: './thumbnail.html'
})
/**
 * @author Thomas Kleinke
 */
export class ThumbnailComponent implements OnChanges {

    @Input() resource: FieldResource;

    public thumbnailUrl: string|undefined;


    constructor(private imagestore: Imagestore,
                private datastore: ImageDatastore,
                private imageModalLauncher: ImageModalLauncher,
                private resourcesComponent: ResourcesComponent) {}


    public openImageModal = () => this.imageModalLauncher.openImageModal(
        this.resource, this.resourcesComponent
    );


    async ngOnChanges() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.resource.relations.isDepictedIn);
    }


    private async getThumbnailUrl(relations: string[]|undefined): Promise<string|undefined> {

        if (!relations || relations.length === 0) return undefined;

        try {
            return this.imagestore.read(relations[0], false, true);
        } catch (e) {
            return BlobMaker.blackImg;
        }
    }
}