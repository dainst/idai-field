import {Injectable} from '@angular/core';
import {Query, ImageDocument} from 'idai-components-2';
import {ImageFilterOption, ImagesState} from './images-state';
import {ImageDocumentsManager} from './image-documents-manager';
import {TypeUtility} from '../../../core/model/type-utility';
import {clone} from '../../../core/util/object-util';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewFacade {

    private static MAX_ROWS: number = 5;

    private static currentPage = 0;

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


    public async turnPage() {

        if (this.canTurnPage()) {

            this.imageDocumentsManager.clearSelection();
            ImageOverviewFacade.currentPage++;
            await this.fetchDocuments();
        }
    }


    public async turnPageBack() {

        if (this.canTurnPageBack()) ImageOverviewFacade.currentPage--;
        await this.fetchDocuments();
    }


    public canTurnPage() {

        const nextPage = ImageOverviewFacade.currentPage + 1;
        return this.getOffset(nextPage) < this.getTotalDocumentCount()
    }


    public canTurnPageBack() {

        return ImageOverviewFacade.currentPage > 0;
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

        ImageOverviewFacade.currentPage = 0;

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

        ImageOverviewFacade.currentPage = 0;

        const query: Query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public setTypeFilters(types: string[]) {

        ImageOverviewFacade.currentPage = 0;

        const query: Query = this.imagesState.getQuery();
        query.types = types;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public setLinkFilter(filterOption: ImageFilterOption) {

        ImageOverviewFacade.currentPage = 0;

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


    /**
     * Set ImageOverviewFacade.currentPage before calling this
     */
    public fetchDocuments() {

        return this.imageDocumentsManager.fetchDocuments(
            this.getLimit(),
            this.getOffset(ImageOverviewFacade.currentPage));
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            types: this.typeUtility.getImageTypeNames()
        };
    }


    private getOffset(page: number) {

        const calculatedOffset = page * this.getGridSize() * ImageOverviewFacade.MAX_ROWS - page /* drop area */;
        return calculatedOffset === -1 ? 0 : calculatedOffset;
    }


    private getLimit() {

        return this.getGridSize() * ImageOverviewFacade.MAX_ROWS - 1 /* drop area */;
    }


    private setQueryConstraints() {

        const query: Query = this.imagesState.getQuery();

        query.constraints = clone(this.getCustomConstraints());

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