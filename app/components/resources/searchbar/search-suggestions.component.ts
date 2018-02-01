import {Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../state/view-facade';

@Component({
    moduleId: module.id,
    selector: 'search-suggestions',
    templateUrl: './search-suggestions.html'
})

/**
 * @author Thomas Kleinke
 */
export class SearchSuggestionsComponent implements OnChanges {

    @Input() q: string = '';
    @Input() types: string[]|undefined;
    @Input() maxSuggestions: number;
    @Input() visible: boolean;

    private suggestedDocuments: Array<IdaiFieldDocument> = [];


    constructor(private routingService: RoutingService,
                private datastore: IdaiFieldDocumentReadDatastore,
                private viewFacade: ViewFacade) {

        this.viewFacade.populateDocumentNotifications().subscribe(async documents => {
            await this.updateSuggestions(documents);
        });
    }


    public jumpToDocument = (document: IdaiFieldDocument) => this.routingService.jumpToRelationTarget(document);


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['visible']) await this.updateSuggestions(this.viewFacade.getDocuments());
    }


    public isSuggestionBoxVisible(): boolean {

        return this.visible && this.suggestedDocuments.length > 0;
    }


    private async updateSuggestions(documents: Array<Document>) {

        if (this.q.length == 0 || documents.length > 0) return this.suggestedDocuments = [];

        this.suggestedDocuments = (await this.datastore.find(this.makeQuery())).documents;

        if (this.suggestedDocuments.length > this.maxSuggestions) {
            this.suggestedDocuments.slice(0, this.maxSuggestions);
        }
    }


    private makeQuery(): Query {

        const query: Query = { q: this.q };
        if (this.types) query.types = this.types;

        return query;
    }
}