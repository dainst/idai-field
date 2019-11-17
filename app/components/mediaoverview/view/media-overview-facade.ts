import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';
import {MediaState} from './media-state';
import {MediaDocumentsManager} from './media-documents-manager';
import {TypeUtility} from '../../../core/model/type-utility';
import {clone} from '../../../core/util/object-util';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class MediaOverviewFacade {

    private currentOffset: number = 0;
    private maxRows: number = 5;
    private maxNrMediaResourcesPerRow: number = 12;
    private minNrMediaResourcesPerRow: number = 2;


    constructor(
        private mediaDocumentsManager: MediaDocumentsManager,
        private mediaState: MediaState,
        private typeUtility: TypeUtility
    ) {}


    public getMaxNrMediaResourcesPerRow = () => this.maxNrMediaResourcesPerRow;

    public getMinNrMediaResourcesPerRow = () => this.minNrMediaResourcesPerRow;

    public select = (document: IdaiFieldMediaDocument) => this.mediaDocumentsManager.select(document);

    public toggleSelected = (document: IdaiFieldMediaDocument) => this.mediaDocumentsManager.toggleSelected(document);

    public getDocuments = (): Array<IdaiFieldMediaDocument> => this.mediaDocumentsManager.getDocuments();

    public getTotalDocumentCount = (): number => this.mediaDocumentsManager.getTotalDocumentCount();

    public remove = (document: IdaiFieldMediaDocument) => this.mediaDocumentsManager.remove(document);

    public getSelected = (): Array<IdaiFieldMediaDocument> => this.mediaDocumentsManager.getSelected();

    public clearSelection = () => this.mediaDocumentsManager.clearSelection();

    public getCustomConstraints = (): { [name: string]: string } => this.mediaState.getCustomConstraints();

    public getNrMediaResourcesPerRow = (): number => this.mediaState.getNrMediaResourcesPerRow();

    public getDepictsRelationsSelected = () => this.mediaDocumentsManager.getDepictsRelationsSelected();

    public getQuery = (): Query => this.mediaState.getQuery();


    public async initialize() {

        if (!this.mediaState.getQuery()) this.mediaState.setQuery(this.getDefaultQuery());
        this.setQueryConstraints();
        await this.fetchDocuments();
    }


    public async increaseNrMediaResourcesPerRow() {

        if (this.getNrMediaResourcesPerRow() < this.getMaxNrMediaResourcesPerRow()) {

            this.mediaState.setNrMediaResourcesPerRow(this.getNrMediaResourcesPerRow() + 1);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public async decreaseNrMediaResourcesPerRow() {

        if (this.getNrMediaResourcesPerRow() > this.getMinNrMediaResourcesPerRow()) {

            this.mediaState.setNrMediaResourcesPerRow(this.getNrMediaResourcesPerRow() - 1);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public async setNrMediaResourcesPerRow(size: number) {

        if (size >= this.getMinNrMediaResourcesPerRow() && size <= this.getMaxNrMediaResourcesPerRow()) {

            this.mediaState.setNrMediaResourcesPerRow(size);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public getPageCount() {

        return Math.ceil(this.getTotalDocumentCount() / this.getNrMediaResourcesPerPage());
    }


    public getCurrentPage() {

        return this.currentOffset / this.getNrMediaResourcesPerPage() + 1;
    }


    public async turnPage() {

        if (this.canTurnPage()) {

            this.mediaDocumentsManager.clearSelection();
            this.currentOffset = this.currentOffset + this.getNrMediaResourcesPerPage();
            await this.fetchDocuments();
        }
    }


    public async turnPageBack() {

        if (this.canTurnPageBack()) {
            this.currentOffset = this.currentOffset - this.getNrMediaResourcesPerPage();
            if (this.currentOffset < 0) this.currentOffset = 0;
        }
        await this.fetchDocuments();
    }


    public canTurnPage() {

        const nextPageOffset = this.currentOffset + this.getNrMediaResourcesPerPage();
        return nextPageOffset < this.getTotalDocumentCount();
    }


    public canTurnPageBack() {

        return this.currentOffset > 0;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        this.currentOffset = 0;

        this.mediaState.setCustomConstraints(customConstraints);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public setQueryString(q: string) {

        this.currentOffset = 0;

        const query: Query = this.mediaState.getQuery();
        query.q = q;
        this.mediaState.setQuery(query);

        this.fetchDocuments();
    }


    public setTypeFilters(types: string[]) {

        this.currentOffset = 0;

        const query: Query = this.mediaState.getQuery();
        query.types = types;
        this.mediaState.setQuery(query);

        this.fetchDocuments();

        this.setCustomConstraints({});
    }


    public fetchDocuments() {

        return this.mediaDocumentsManager.fetchDocuments(
            this.getLimit(),
            this.currentOffset);
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            types: this.typeUtility.getMediaTypeNames()
        };
    }


    private getLimit() {

        return this.getNrMediaResourcesPerRow() * this.maxRows - 1 /* drop area */;
    }


    private getNrMediaResourcesPerPage() {

        return this.maxRows * this.getNrMediaResourcesPerRow() - 1;
    }


    private setQueryConstraints() {

        this.mediaState.getQuery().constraints = clone(this.getCustomConstraints());
    }
}
