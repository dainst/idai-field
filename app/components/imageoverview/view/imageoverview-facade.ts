import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {Query} from 'idai-components-2/datastore';
import {ImageTypeUtility} from '../../../common/image-type-utility';
import {ImagesState} from './images-state';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {ImageDocumentsManager} from './image-documents-manager';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewFacade {

    constructor(
        private imageDocumentsManager: ImageDocumentsManager,
        private imagesState: ImagesState,
        private imageTypeUtility: ImageTypeUtility
    ) {

    }


    public initialize() {

        return this.imagesState.initialize().then(() => {
            if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
            this.setQueryConstraints();
        });
    }


    public getDepictsRelationsSelected() {

        return this.imageDocumentsManager.getDepictsRelationsSelected();
    }


    public getGridSize(): number {

        return this.imagesState.getGridSize();
    }


    public getQuery(): Query {

        return this.imagesState.getQuery();
    }


    public getMainTypeDocumentFilterOption() {

        return this.imagesState.getMainTypeDocumentFilterOption()
    }


    public setGridSize(size: number) {

        this.imagesState.setGridSize(size);
    }


    public setQueryString(q: string) {

        const query: Query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public resetSearch() {

        this.imagesState.setQuery(this.getDefaultQuery());
        this.imagesState.setMainTypeDocumentFilterOption('');
    }


    public setQueryTypes(types: string[]) {

        const query: Query = this.imagesState.getQuery();
        query.types = types;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.imagesState.setMainTypeDocumentFilterOption(filterOption);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public select(document: IdaiFieldImageDocument) {

        return this.imageDocumentsManager.select(document);
    }


    public getDocuments(): Array<IdaiFieldImageDocument> {

        return this.imageDocumentsManager.getDocuments();
    }


    public remove(document: IdaiFieldImageDocument) {

        return this.imageDocumentsManager.remove(document);
    }


    public getSelected(): Array<IdaiFieldImageDocument> {

        return this.imageDocumentsManager.getSelected();
    }


    public clearSelection() {

        return this.imageDocumentsManager.clearSelection();
    }


    public fetchDocuments() {

        return this.imageDocumentsManager.fetchDocuments();
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            types: this.imageTypeUtility.getProjectImageTypeNames()
        };
    }


    private setQueryConstraints() {

        const query: Query = this.imagesState.getQuery();

        switch(this.imagesState.getMainTypeDocumentFilterOption()) {

            case 'UNLINKED':
                this.imagesState.getQuery().constraints = { 'resource.relations.depicts': 'UNKNOWN' };
                break;

            case 'LINKED':
                this.imagesState.getQuery().constraints = { 'resource.relations.depicts': 'KNOWN' };
                break;

            // case 'ALL':
            default:
                delete query.constraints;
        }
    }
}