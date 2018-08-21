import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImagesState} from './images-state';
import {ImageDocumentsManager} from './image-documents-manager';
import {TypeUtility} from '../../../core/model/type-utility';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewFacade {

    private static MAX_ROWS: number = 5;

    constructor(
        private imageDocumentsManager: ImageDocumentsManager,
        private imagesState: ImagesState,
        private typeUtility: TypeUtility
    ) {}


    public initialize() {

        return this.imagesState.initialize().then(() => {
            if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
            this.setQueryConstraints();
        }).then(() => this.fetchDocuments());
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

        return this.imagesState.getMainTypeDocumentFilterOption();
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


    public setTypeFilters(types: string[]) {

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


    public getTotalDocumentCount(): number {

        return this.imageDocumentsManager.getTotalDocumentCount();
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

        return this.imageDocumentsManager.fetchDocuments(ImageOverviewFacade.MAX_ROWS * this.getGridSize() - 1);
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            types: this.typeUtility.getImageTypeNames()
        };
    }


    private setQueryConstraints() {

        const query: Query = this.imagesState.getQuery();

        switch(this.imagesState.getMainTypeDocumentFilterOption()) {

            case 'UNLINKED':
                this.imagesState.getQuery().constraints = { 'depicts:exist': 'UNKNOWN' };
                break;

            case 'LINKED':
                this.imagesState.getQuery().constraints = { 'depicts:exist': 'KNOWN' };
                break;

            // case 'ALL':
            default:
                delete query.constraints;
        }
    }
}