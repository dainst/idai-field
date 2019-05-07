import {Component, Input, OnChanges} from '@angular/core';
import {BlobMaker} from '../../../../core/imagestore/blob-maker';
import {Imagestore} from '../../../../core/imagestore/imagestore';

@Component({
    selector: 'thumbnail',
    moduleId: module.id,
    templateUrl: './thumbnail.html'
})
/**
 * @author Thomas Kleinke
 */
export class ThumbnailComponent implements OnChanges {

    @Input() depictedInRelations: any[]|undefined;

    public thumbnailUrl: string|undefined;


    constructor(private imagestore: Imagestore) {}


    async ngOnChanges() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.depictedInRelations);
    }


    private async getThumbnailUrl(relations: any|undefined): Promise<string|undefined> {

        if (!relations || relations.length === 0) return undefined;

        try {
            return this.imagestore.read(
                relations[0], false, true
            );
        } catch (e) {
            return BlobMaker.blackImg;
        }
    }
}