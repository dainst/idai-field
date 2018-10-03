import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Query} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
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
    private documentsFound: boolean;


    constructor(private routingService: RoutingService,
                private datastore: IdaiFieldDocumentReadDatastore,
                private viewFacade: ViewFacade) {

        this.viewFacade.populateDocumentNotifications().subscribe(async documents => {
            this.documentsFound = documents.length > 0;
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

        return this.visible && !this.documentsFound;
    }


    private async updateSuggestions() {

        if ((this.viewFacade.getSearchString().length === 0 && this.viewFacade.getFilterTypes().length === 0)
                || this.documentsFound) {
            return this.suggestedDocuments = [];
        }

        this.suggestedDocuments = (await this.datastore.find(this.makeQuery())).documents;
    }


    private makeQuery(): Query {

        return {
            q: this.viewFacade.getSearchString(),
            types: this.viewFacade.getFilterTypes().length > 0 ? this.viewFacade.getFilterTypes() : undefined,
            constraints: this.viewFacade.getCustomConstraints(),
            limit: this.maxSuggestions
        };
    }
}