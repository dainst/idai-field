import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Query, IdaiFieldDocument} from 'idai-components-2';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../view/view-facade';
import {ResourcesComponent} from '../resources.component';
import {ResourcesSearchBarComponent} from './resources-search-bar.component';

@Component({
    moduleId: module.id,
    selector: 'search-suggestions',
    templateUrl: './search-suggestions.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class SearchSuggestionsComponent implements OnChanges {

    @Input() maxSuggestions: number;
    @Input() visible: boolean;

    public selectedSuggestion: IdaiFieldDocument|undefined;

    private suggestedDocuments: Array<IdaiFieldDocument> = [];
    private documentsFound: boolean;


    constructor(private routingService: RoutingService,
                private datastore: IdaiFieldDocumentReadDatastore,
                private viewFacade: ViewFacade,
                private resourcesSearchBarComponent: ResourcesSearchBarComponent,
                private resourcesComponent: ResourcesComponent) {

        this.viewFacade.populateDocumentNotifications().subscribe(async documents => {
            this.documentsFound = documents.length > 0;
            await this.updateSuggestions();
        });
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['visible']) await this.updateSuggestions();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') return this.close();
        if (!this.visible || this.suggestedDocuments.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                this.selectNextSuggestion();
                break;
            case 'ArrowUp':
                this.selectPreviousSuggestion();
                break;
            case 'Enter':
                if (this.selectedSuggestion) await this.jumpToDocument(this.selectedSuggestion);
                break;
        }
    }


    public async jumpToDocument(document: IdaiFieldDocument) {

        await this.viewFacade.setSearchString('', false);
        await this.routingService.jumpToRelationTarget(document);
        this.resourcesComponent.setScrollTarget(document);
    }


    public isSuggestionBoxVisible(): boolean {

        return this.visible && !this.documentsFound
            && (this.viewFacade.getSearchString().length > 0 || this.viewFacade.getFilterTypes().length > 0);
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


    private selectNextSuggestion() {

        if (!this.selectedSuggestion) {
            this.selectedSuggestion = this.suggestedDocuments[0];
            return;
        }

        const index: number = this.suggestedDocuments.indexOf(this.selectedSuggestion) + 1;
        this.selectedSuggestion = index < this.suggestedDocuments.length
            ? this.suggestedDocuments[index]
            : this.suggestedDocuments[0];
    }


    private selectPreviousSuggestion() {

        if (!this.selectedSuggestion) {
            this.selectedSuggestion = this.suggestedDocuments[this.suggestedDocuments.length - 1];
            return;
        }

        const index: number = this.suggestedDocuments.indexOf(this.selectedSuggestion) - 1;
        this.selectedSuggestion = index >= 0
            ? this.suggestedDocuments[index]
            : this.suggestedDocuments[this.suggestedDocuments.length - 1];
    }


    private close() {

        this.resourcesSearchBarComponent.suggestionsVisible = false;
        this.resourcesSearchBarComponent.blur();
    }
}