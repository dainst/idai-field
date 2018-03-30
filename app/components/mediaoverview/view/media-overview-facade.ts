import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2/datastore';
import {MediaState} from './media-state';
import {MediaDocumentsManager} from './media-documents-manager';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class MediaOverviewFacade {

    private static MAX_ROWS: number = 5;

    constructor(
        private mediaDocumentsManager: MediaDocumentsManager,
        private mediaState: MediaState
    ) {}


    public initialize() {

        return this.mediaState.initialize().then(() => {
            if (!this.mediaState.getQuery()) this.mediaState.setQuery(this.getDefaultQuery());
            this.setQueryConstraints();
        }).then(() => this.fetchDocuments());
    }


    public getDepictsRelationsSelected() {

        return this.mediaDocumentsManager.getDepictsRelationsSelected();
    }


    public getGridSize(): number {

        return this.mediaState.getGridSize();
    }


    public getQuery(): Query {

        return this.mediaState.getQuery();
    }


    public getMainTypeDocumentFilterOption() {

        return this.mediaState.getMainTypeDocumentFilterOption();
    }


    public setGridSize(size: number) {

        this.mediaState.setGridSize(size);
    }


    public setQueryString(q: string) {

        const query: Query = this.mediaState.getQuery();
        query.q = q;
        this.mediaState.setQuery(query);

        this.fetchDocuments();
    }


    public resetSearch() {

        this.mediaState.setQuery(this.getDefaultQuery());
        this.mediaState.setMainTypeDocumentFilterOption('');
    }


    public setQueryTypes(types: string[]) {

        const query: Query = this.mediaState.getQuery();
        query.types = types;
        this.mediaState.setQuery(query);

        this.fetchDocuments();
    }


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.mediaState.setMainTypeDocumentFilterOption(filterOption);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public select(document: IdaiFieldMediaDocument) {

        return this.mediaDocumentsManager.select(document);
    }


    public getDocuments(): Array<IdaiFieldMediaDocument> {

        return this.mediaDocumentsManager.getDocuments();
    }


    public getTotalDocumentCount(): number {

        return this.mediaDocumentsManager.getTotalDocumentCount();
    }


    public remove(document: IdaiFieldMediaDocument) {

        return this.mediaDocumentsManager.remove(document);
    }


    public getSelected(): Array<IdaiFieldMediaDocument> {

        return this.mediaDocumentsManager.getSelected();
    }


    public clearSelection() {

        return this.mediaDocumentsManager.clearSelection();
    }


    public fetchDocuments() {

        return this.mediaDocumentsManager.fetchDocuments(MediaOverviewFacade.MAX_ROWS * this.getGridSize() - 1);
    }


    public getDefaultQuery(): Query {

        return { q: '' };
    }


    private setQueryConstraints() {

        const query: Query = this.mediaState.getQuery();

        switch(this.mediaState.getMainTypeDocumentFilterOption()) {

            case 'UNLINKED':
                this.mediaState.getQuery().constraints = { 'depicts:exist': 'UNKNOWN' };
                break;

            case 'LINKED':
                this.mediaState.getQuery().constraints = { 'depicts:exist': 'KNOWN' };
                break;

            // case 'ALL':
            default:
                delete query.constraints;
        }
    }
}