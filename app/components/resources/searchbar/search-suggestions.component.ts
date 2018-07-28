import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Document, Query} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../view/view-facade';

@Component({
    moduleId: module.id,
    selector: 'search-suggestions',
    templateUrl: './search-suggestions.html'
})

/**
 * @author Thomas Kleinke
 */
export class SearchSuggestionsComponent implements OnChanges {

    @Input() maxSuggestions: number;
    @Input() visible: boolean;

    private suggestedDocuments: Array<IdaiFieldDocument> = [];
    private documents: Array<Document> = [];


    constructor(private routingService: RoutingService,
                private datastore: IdaiFieldDocumentReadDatastore,
                private viewFacade: ViewFacade) {

        this.viewFacade.populateDocumentNotifications().subscribe(async documents => {
            this.documents = documents;
            await this.updateSuggestions();
        });
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['visible']) await this.updateSuggestions();
    }


    public async jumpToDocument(document: IdaiFieldDocument) {

        await this.viewFacade.setSearchString('', false);
        this.routingService.jumpToRelationTarget(document);
    }


    public isSuggestionBoxVisible(): boolean {

        return this.visible && this.documents.length == 0;
    }


    private async updateSuggestions() {

        if (this.viewFacade.getSearchString().length == 0 || this.documents.length > 0) {
            return this.suggestedDocuments = [];
        }

        this.suggestedDocuments = (await this.datastore.find(this.makeQuery())).documents;
    }


    private makeQuery(): Query {

        const query: Query = {
            q: this.viewFacade.getSearchString(),
            types: this.viewFacade.getFilterTypes().length > 0 ? this.viewFacade.getFilterTypes() : undefined,
            limit: this.maxSuggestions
        };

        return query;
    }
}