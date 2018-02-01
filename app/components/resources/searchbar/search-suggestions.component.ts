import {Component, Input, OnChanges, ViewChild, SimpleChanges} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ViewFacade} from '../state/view-facade';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {includedIn, isNot} from '../../../util/list-util';
import {RoutingService} from '../../routing-service';

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

    @ViewChild('suggestionBox') suggestionBox: HTMLElement;

    private suggestedDocuments: Array<IdaiFieldDocument> = [];


    constructor(private viewFacade: ViewFacade,
                private routingService: RoutingService,
                private datastore: IdaiFieldDocumentReadDatastore) {}


    public jumpToDocument = (document: IdaiFieldDocument) => this.routingService.jumpToRelationTarget(document);


    async ngOnChanges(changes: SimpleChanges) {

        await this.updateSuggestions();
    }


    public isSuggestionBoxVisible(): boolean {

        return this.visible && this.suggestedDocuments.length > 0;
    }


    private async updateSuggestions() {

        if (this.q.length == 0) return this.suggestedDocuments = [];

        const {documents} = await this.datastore.find(this.makeQuery());
        const listDocuments: Array<Document> = this.viewFacade.getDocuments();

        this.suggestedDocuments = documents.filter(isNot(includedIn(listDocuments)));
        if (this.suggestedDocuments.length > this.maxSuggestions) this.suggestedDocuments.slice(0, this.maxSuggestions);
    }


    private makeQuery(): Query {

        const query: Query = { q: this.q };
        if (this.types) query.types = this.types;

        return query;
    }
}