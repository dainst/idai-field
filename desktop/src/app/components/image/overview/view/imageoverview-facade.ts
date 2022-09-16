import { clone, equal }  from 'tsfun';
import { ImageDocument, Named, Query, ProjectConfiguration } from 'idai-field-core';
import { ImagesState } from './images-state';
import { ImageDocumentsManager } from './image-documents-manager';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewFacade {

    private currentOffset: number = 0;
    private maxRows: number = 5;
    private maxNrImagesPerRow: number = 12;
    private minNrImagesPerRow: number = 2;


    constructor(private imageDocumentsManager: ImageDocumentsManager,
                private imagesState: ImagesState,
                private projectConfiguration: ProjectConfiguration) {}


    public getMaxNrImagesPerRow = () => this.maxNrImagesPerRow;

    public getMinNrImagesPerRow = () => this.minNrImagesPerRow;

    public select = (document: ImageDocument) => this.imageDocumentsManager.select(document);

    public toggleSelected = (document: ImageDocument, multiSelect?: boolean) =>
        this.imageDocumentsManager.toggleSelected(document, multiSelect);

    public getDocuments = (): Array<ImageDocument> => this.imageDocumentsManager.getDocuments();

    public getTotalDocumentCount = (): number => this.imageDocumentsManager.getTotalDocumentCount();

    public remove = (document: ImageDocument) => this.imageDocumentsManager.remove(document);

    public getSelected = (): Array<ImageDocument> => this.imageDocumentsManager.getSelected();

    public clearSelection = () => this.imageDocumentsManager.clearSelection();

    public getCustomConstraints = (): { [name: string]: string } => this.imagesState.getCustomConstraints();

    public getNrImagesPerRow = (): number => this.imagesState.getNrImagesPerRow();

    public getDepictsRelationsSelected = () => this.imageDocumentsManager.getDepictsRelationsSelected();

    public getQuery = (): Query => this.imagesState.getQuery();


    public async initialize() {

        if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
        this.setQueryConstraints();
        await this.fetchDocuments();
    }


    public async increaseNrImagesPerRow() {

        if (this.getNrImagesPerRow() < this.getMaxNrImagesPerRow()) {

            this.imagesState.setNrImagesPerRow(this.getNrImagesPerRow() + 1);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public async decreaseNrImagesPerRow() {

        if (this.getNrImagesPerRow() > this.getMinNrImagesPerRow()) {

            this.imagesState.setNrImagesPerRow(this.getNrImagesPerRow() - 1);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public async setNrImagesPerRow(size: number) {

        if (size >= this.getMinNrImagesPerRow() && size <= this.getMaxNrImagesPerRow()) {

            this.imagesState.setNrImagesPerRow(size);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public getPageCount() {

        return Math.ceil(this.getTotalDocumentCount() / this.getNrImagesPerPage());
    }


    public getCurrentPage() {

        return this.currentOffset / this.getNrImagesPerPage() + 1;
    }


    public async turnPage() {

        if (this.canTurnPage()) {

            this.imageDocumentsManager.clearSelection();
            this.currentOffset = this.currentOffset + this.getNrImagesPerPage();
            await this.fetchDocuments();
        }
    }


    public async turnPageBack() {

        if (this.canTurnPageBack()) {
            this.currentOffset = this.currentOffset - this.getNrImagesPerPage();
            if (this.currentOffset < 0) this.currentOffset = 0;
        }
        await this.fetchDocuments();
    }


    public canTurnPage() {

        const nextPageOffset = this.currentOffset + this.getNrImagesPerPage();
        return nextPageOffset < this.getTotalDocumentCount();
    }


    public canTurnPageBack() {

        return this.currentOffset > 0;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        if (equal(this.imagesState.getCustomConstraints(), customConstraints)) return;

        this.currentOffset = 0;

        this.imagesState.setCustomConstraints(customConstraints);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public setQueryString(q: string) {

        this.currentOffset = 0;

        const query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public setCategoryFilters(categories: string[]) {

        this.currentOffset = 0;

        const query = this.imagesState.getQuery();
        query.categories = categories;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public fetchDocuments() {

        return this.imageDocumentsManager.fetchDocuments(
            this.getLimit(),
            this.currentOffset);
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            categories: this.projectConfiguration.getImageCategories().map(Named.toName)
        };
    }


    private getLimit() {

        return this.getNrImagesPerRow() * this.maxRows - 1 /* drop area */;
    }


    private getNrImagesPerPage() {

        return this.maxRows * this.getNrImagesPerRow() - 1;
    }


    private setQueryConstraints() {

        this.imagesState.getQuery().constraints = clone(this.getCustomConstraints());
    }
}
