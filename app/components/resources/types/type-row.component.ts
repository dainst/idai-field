import {Component, Input, OnChanges} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {FieldDocument, Document} from 'idai-components-2';
import {ReadImagestore} from '../../../core/imagestore/read-imagestore';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';


@Component({
    selector: 'type-row',
    moduleId: module.id,
    templateUrl: './type-row.html',
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRowComponent implements OnChanges {

    @Input() document: FieldDocument;

    public mainThumbnailUrl: string|undefined;
    public linkedThumbnailUrls: string[] = [];


    constructor(private imagestore: ReadImagestore,
                private datastore: FieldReadDatastore) {}


    async ngOnChanges() {

        this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);
        this.linkedThumbnailUrls = await this.getLinkedThumbnailUrls(this.document);
    }


    private async getMainThumbnailUrl(document: FieldDocument): Promise<string|undefined> {

        if (!Document.hasRelations(document, 'isDepictedIn')) return undefined;

        return await this.imagestore.read(
            document.resource.relations['isDepictedIn'][0],
            false,
            true
        );
    }


    private async getLinkedThumbnailUrls(document: FieldDocument): Promise<string[]> {

        return document.resource.type === 'TypeCatalog'
            ? this.getLinkedThumbnailUrlsForTypeCatalog(document)
            : this.getLinkedThumbnailUrlsForType(document);
    }


    private async getLinkedThumbnailUrlsForTypeCatalog(document: FieldDocument): Promise<string[]> {

        const documents: Array<FieldDocument> = (await this.datastore.find(
            { constraints: { 'liesWithin:contain': document.resource.id } }
        )).documents;

        return (await asyncMap(
            (document: FieldDocument) => this.getTypeThumbnailUrl(document)
        )(documents)).filter(id => id !== undefined) as string[];
    }


    private async getLinkedThumbnailUrlsForType(document: FieldDocument): Promise<string[]> {

        const documents: Array<FieldDocument> = (await this.datastore.find(
            { constraints: { 'isInstanceOf:contain': document.resource.id } }
        )).documents;

        return (await asyncMap(
            (document: FieldDocument) => this.getMainThumbnailUrl(document)
        )(documents)).filter(id => id !== undefined) as string[];
    }


    private async getTypeThumbnailUrl(document: FieldDocument): Promise<string|undefined> {

        let thumbnailUrl: string|undefined = await this.getMainThumbnailUrl(document);

        if (!thumbnailUrl) {
            const linkedThumbnailUrls: string[] = await this.getLinkedThumbnailUrlsForType(document);
            if (linkedThumbnailUrls.length > 0) thumbnailUrl = linkedThumbnailUrls[0];
        }

        return thumbnailUrl;
    }
}