import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Datastore, FieldResource, ImageVariant } from 'idai-field-core';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';


@Component({
    selector: 'thumbnail',
    templateUrl: './thumbnail.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ThumbnailComponent implements OnChanges {

    @Input() resource: FieldResource;

    @Output() onClick: EventEmitter<void> = new EventEmitter<void>();

    public thumbnailUrl: SafeResourceUrl|undefined;
    public thumbnailPlaceholderCategory: string|undefined;


    constructor(private imageUrlMaker: ImageUrlMaker,
                private datastore: Datastore) {}


    public isThumbnailFound = (): boolean => !this.thumbnailPlaceholderCategory;

    public onImageClicked = () => this.onClick.emit();


    async ngOnChanges() {

        await this.updateThumbnailUrl();
    }


    public getNumberOfImagesTooltip(): string {

        return this.getNumberOfImages() === 1
            ? $localize `:@@widgets.documentInfo.thumbnail.oneLinkedImage:Ein verknüpftes Bild`
            : this.getNumberOfImages() + ' ' + $localize `:@@widgets.documentInfo.thumbnail.linkedImages:verknüpfte Bilder`;
    }


    public getNumberOfImages(): number {

        return this.resource.relations.isDepictedIn
            ? this.resource.relations.isDepictedIn.length
            : 0;
    }


    private async updateThumbnailUrl() {

        this.thumbnailUrl = undefined;

        const relationTargets: string[] = this.resource.relations.isDepictedIn;
        if (!relationTargets || relationTargets.length === 0) return undefined;

        try {
            this.thumbnailUrl = await this.imageUrlMaker.getUrl(relationTargets[0], ImageVariant.THUMBNAIL);
            this.thumbnailPlaceholderCategory = undefined;
        } catch (err) {
            this.updateThumbnailPlaceholder(relationTargets);
        }

        if (this.thumbnailUrl === ImageUrlMaker.blackImg) this.updateThumbnailPlaceholder(relationTargets);
    }


    private async updateThumbnailPlaceholder(relationTargets: string[]) {

        this.thumbnailPlaceholderCategory = (await this.datastore.get(relationTargets[0])).resource.category;
    }
}
