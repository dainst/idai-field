import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {FieldResource} from 'idai-components-2';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';


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
    @Input() modal: 'image'|'resource' = 'image';

    @Output() onClick: EventEmitter<void> = new EventEmitter<void>();

    public thumbnailUrl: SafeResourceUrl|undefined;


    constructor(private imagestore: Imagestore) {}


    public isThumbnailFound = (): boolean => this.thumbnailUrl !== BlobMaker.blackImg;

    public onImageClicked = () => this.onClick.emit();


    async ngOnChanges() {

        await this.updateThumbnailUrl();
    }


    private async updateThumbnailUrl() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.resource.relations.isDepictedIn);
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