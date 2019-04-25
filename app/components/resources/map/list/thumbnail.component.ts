import {Component, Input, OnChanges} from '@angular/core';
import {Document, FieldDocument} from 'idai-components-2';
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

    @Input() document: FieldDocument;

    public thumbnailUrl: string|undefined;


    constructor(private imagestore: Imagestore) {}


    async ngOnChanges() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.document);
    }


    private async getThumbnailUrl(document: FieldDocument): Promise<string|undefined> {

        if (!Document.hasRelations(document, 'isDepictedIn')) return undefined;

        try {
            return this.imagestore.read(
                document.resource.relations['isDepictedIn'][0], false, true
            );
        } catch (e) {
            return BlobMaker.blackImg;
        }
    }
}