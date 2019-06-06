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

    private currentPage = 0;

    private maxRows: number = 5;
    private maxNrImagesPerRow: number = 12;
    private minNrImagesPerRow: number = 2;

    constructor(
        private imageDocumentsManager: ImageDocumentsManager,
        private imagesState: ImagesState,
        private typeUtility: TypeUtility
    ) {}


    public getMaxNrImagesPerRow = () => this.maxNrImagesPerRow;

    public getMinNrImagesPerRow = () => this.minNrImagesPerRow;

    public select = (document: ImageDocument) => this.imageDocumentsManager.select(document);

    public toggleSelected = (document: ImageDocument) => this.imageDocumentsManager.toggleSelected(document);

    public getDocuments = (): Array<ImageDocument> => this.imageDocumentsManager.getDocuments();

    public getTotalDocumentCount = (): number => this.imageDocumentsManager.getTotalDocumentCount();

    public remove = (document: ImageDocument) => this.imageDocumentsManager.remove(document);

    public getSelected = (): Array<ImageDocument> => this.imageDocumentsManager.getSelected();

    public clearSelection = () => this.imageDocumentsManager.clearSelection();

    public getCustomConstraints = (): { [name: string]: string } => this.imagesState.getCustomConstraints();

    public getLinkFilter = (): ImageFilterOption => this.imagesState.getLinkFilter();

    public getNrImagesPerRow = (): number => this.imagesState.getNrImagesPerRow();

    public getDepictsRelationsSelected = () => this.imageDocumentsManager.getDepictsRelationsSelected();

    public getQuery = (): Query => this.imagesState.getQuery();


    public async initialize() {

        await this.imagesState.initialize();
        if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
        this.setQueryConstraints();
        await this.fetchDocuments();
    }


    public async increaseNrImagesPerRow() {

        if (this.getNrImagesPerRow() < this.getMaxNrImagesPerRow()) {

            this.imagesState.setNrImagesPerRow(this.getNrImagesPerRow() + 1);
            this.currentPage = 0;
            await this.fetchDocuments();
        }
    }


    public async decreaseNrImagesPerRow() {

        if (this.getNrImagesPerRow() > this.getMinNrImagesPerRow()) {

            this.imagesState.setNrImagesPerRow(this.getNrImagesPerRow() - 1);
            this.currentPage = 0;
            await this.fetchDocuments();
        }
    }


    public async setNrImagesPerRow(size: number) {

        if (size >= this.getMinNrImagesPerRow() && size <= this.getMaxNrImagesPerRow()) {

            this.imagesState.setNrImagesPerRow(size);
            this.currentPage = 0;
            // this.imageGrid.nrOfColumns = _size;
            await this.fetchDocuments();
        }
    }


    public async turnPage() {

        if (this.canTurnPage()) {

            this.imageDocumentsManager.clearSelection();
            this.currentPage++;
            await this.fetchDocuments();
        }
    }


    public async turnPageBack() {

        if (this.canTurnPageBack()) this.currentPage--;
        await this.fetchDocuments();
    }


    public canTurnPage() {

        const nextPage = this.currentPage + 1;
        return this.getOffset(nextPage) < this.getTotalDocumentCount()
    }


    public canTurnPageBack() {

        return this.currentPage > 0;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        this.currentPage = 0;

        this.imagesState.setCustomConstraints(customConstraints);
        this.setQueryConstraints();

        this.fetchDocuments();
    }



    public setQueryString(q: string) {

        this.currentPage = 0;

        const query: Query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public setTypeFilters(types: string[]) {

        this.currentPage = 0;

        const query: Query = this.imagesState.getQuery();
        query.types = types;
        this.imagesState.setQuery(query);

        this.fetchDocuments();

        this.setCustomConstraints({});
    }


    public setLinkFilter(filterOption: ImageFilterOption) {

        this.currentPage = 0;

        this.imagesState.setLinkFilter(filterOption);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    /**
     * Set ImageOverviewFacade.currentPage before calling this
     */
    public fetchDocuments() {

        return this.imageDocumentsManager.fetchDocuments(
            this.getLimit(),
            this.getOffset(this.currentPage));
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            types: this.typeUtility.getImageTypeNames()
        };
    }


    private getOffset(page: number) {

        const calculatedOffset = page * this.getNrImagesPerRow() * this.maxRows - page /* drop area */;
        return calculatedOffset === -1 ? 0 : calculatedOffset;
    }


    private getLimit() {

        return this.getNrImagesPerRow() * this.maxRows - 1 /* drop area */;
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