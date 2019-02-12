import {Injectable} from '@angular/core';
import {Query, ImageDocument} from 'idai-components-2';
import {ImageFilterOption, ImagesState} from './images-state';
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


    public getCustomConstraints(): { [name: string]: string } {

        return this.imagesState.getCustomConstraints();
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        this.imagesState.setCustomConstraints(customConstraints);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public getLinkFilter(): ImageFilterOption {

        return this.imagesState.getLinkFilter();
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


    public setTypeFilters(types: string[]) {

        const query: Query = this.imagesState.getQuery();
        query.types = types;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public setLinkFilter(filterOption: ImageFilterOption) {

        this.imagesState.setLinkFilter(filterOption);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public select(document: ImageDocument) {

        this.imageDocumentsManager.select(document);
    }


    public toggleSelected(document: ImageDocument) {

        this.imageDocumentsManager.toggleSelected(document);
    }


    public getDocuments(): Array<ImageDocument> {

        return this.imageDocumentsManager.getDocuments();
    }


    public getTotalDocumentCount(): number {

        return this.imageDocumentsManager.getTotalDocumentCount();
    }


    public remove(document: ImageDocument) {

        return this.imageDocumentsManager.remove(document);
    }


    public getSelected(): Array<ImageDocument> {

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
            types: []
        };
    }


    private setQueryConstraints() {

        const query: Query = this.imagesState.getQuery();

        query.constraints = this.getCustomConstraints();

        switch(this.imagesState.getLinkFilter()) {
            case 'UNLINKED':
                query.constraints['depicts:exist'] = 'UNKNOWN';
                break;
            case 'LINKED':
                query.constraints['depicts:exist'] = 'KNOWN';
                break;
            case 'ALL':
                delete query.constraints['depicts:exist'];
        }
    }
}