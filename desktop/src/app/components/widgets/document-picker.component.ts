import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import * as tsfun from 'tsfun';
import { FieldDocument, CategoryForm, Query, Datastore, Constraint } from 'idai-field-core';
import { Loading } from './loading';
import { AngularUtility } from '../../angular/angular-utility';
import { Messages } from '../messages/messages';
import { getDocumentSuggestions } from './get-document-suggestions';


@Component({
    selector: 'document-picker',
    templateUrl: './document-picker.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DocumentPickerComponent implements OnChanges {

    @Input() filterOptions: Array<CategoryForm>;
    @Input() getConstraints: () => Promise<{ [name: string]: string|Constraint }>;
    @Input() showProjectOption: boolean = false;
    @Input() limit: number = 50;
    @Input() waitForUserInput: boolean = true;

    @Output() documentSelected: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public documents: Array<FieldDocument>;

    private query: Query = {};
    private currentQueryId: string;


    constructor(private datastore: Datastore,
                private loading: Loading,
                private messages: Messages,
                private i18n: I18n) {}


    public isLoading = () => this.loading.isLoading();


    async ngOnChanges() {

        this.query.categories = this.getAllAvailableCategoryNames();
        await this.updateResultList();
    }


    public getQueryCategories(): string[]|undefined {

        if (!this.query.categories) return undefined;

        return this.query.categories.length === this.getAllAvailableCategoryNames().length
                && this.filterOptions.length > 1
            ? undefined
            : this.query.categories;
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.updateResultList();
    }


    public async setQueryCategories(categories: string[]) {

        if (categories && categories.length > 0) {
            this.query.categories = categories;
        } else {
            this.query.categories = this.getAllAvailableCategoryNames();
        }

        await this.updateResultList();
    }


    public isQuerySpecified(): boolean {

        return ((this.query.q !== undefined && this.query.q.length > 0)
            || (this.query.categories !== undefined
                && (this.query.categories.length < this.getAllAvailableCategoryNames().length
                    || this.query.categories.length === 1)));
    }


    private async updateResultList() {

        this.documents = [];
        if (!this.waitForUserInput || this.isQuerySpecified()) {
            await this.fetchDocuments();
        }
    }


    private async fetchDocuments() {

        this.loading.start('documentPicker');
        await AngularUtility.refresh();

        this.query.limit = this.limit;
        this.currentQueryId = new Date().toISOString();
        const queryId = this.currentQueryId;
        const constraints = this.getConstraints ? await this.getConstraints() : undefined;
        const query = tsfun.update('constraints', constraints, this.query);
        try {
            const documents = await getDocumentSuggestions(this.datastore, query);
            if (this.currentQueryId === queryId) this.documents = this.filterDocuments(documents as Array<FieldDocument>);

        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            this.loading.stop('documentPicker');
        }
    }


    private getAllAvailableCategoryNames(): string[] {

        return tsfun.union(this.filterOptions.map(category => {
            return category.children
                ? [category.name].concat(category.children.map(child => child.name))
                : [category.name];
        }));
    }


    private getProjectOption(): FieldDocument {

        return {
            resource: {
                id: 'project',
                identifier: this.i18n({ id: 'widgets.documentPicker.project', value: 'Projekt' }),
                category: 'Project'
            }
        } as any;
    }


    private isProjectOptionVisible(): boolean {

        return this.showProjectOption
            && ((this.query.q !== undefined && this.query.q.length > 0
                && this.i18n({ id: 'widgets.documentPicker.project', value: 'Projekt' })
                    .toLowerCase().startsWith(this.query.q.toLowerCase()))
                || (this.query.categories !== undefined && this.query.categories.includes('Project')));
    }


    private filterDocuments(documents: Array<FieldDocument>): Array<FieldDocument> {

        return this.isProjectOptionVisible()
            ? [this.getProjectOption()].concat(
                documents
                    .filter(document => document.resource.category !== 'Project')
            )
            : documents;
    }
}
