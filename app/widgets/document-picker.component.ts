import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {union} from 'tsfun';
import {Query, FieldDocument, ProjectConfiguration, IdaiType} from 'idai-components-2';
import {FieldDatastore} from '../core/datastore/field/field-datastore';
import {Loading} from './loading';
import {clone} from '../core/util/object-util';

@Component({
    selector: 'document-picker',
    moduleId: module.id,
    templateUrl: './document-picker.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DocumentPickerComponent implements OnChanges {

    @Input() filterOptions: Array<IdaiType>;

    @Output() documentSelected: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public documents: Array<FieldDocument>;

    private query: Query = { limit: 50 };
    private currentQueryId: string;


    constructor(private datastore: FieldDatastore,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading) {}


    public isLoading = () => this.loading.isLoading();


    async ngOnChanges() {

        this.query.types = this.getAllAvailableTypeNames();
        await this.updateResultList();
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.updateResultList();
    }


    public async setQueryTypes(types: string[]) {

        if (types && types.length > 0) {
            this.query.types = types;
        } else {
            this.query.types = this.getAllAvailableTypeNames();
        }

        await this.updateResultList();
    }


    public isQuerySpecified(): boolean {

        return ((this.query.q !== undefined && this.query.q.length > 0)
            || (this.query.types !== undefined
                && this.query.types.length < this.getAllAvailableTypeNames().length));
    }


    private async updateResultList() {

        this.documents = [];
        if (this.isQuerySpecified()) await this.fetchDocuments();
    }


    private async fetchDocuments() {

        this.loading.start();

        this.currentQueryId = new Date().toISOString();
        this.query.id = this.currentQueryId;

        try {
            const result = await this.datastore.find(clone(this.query));
            if (result.queryId === this.currentQueryId) this.documents = result.documents;
        } catch (err) {
            console.error(err);
        } finally {
            this.loading.stop();
        }
    }


    private getAllAvailableTypeNames(): string[] {

        return union(this.filterOptions.map(type => {
            return type.children
                ? [type.name].concat(type.children.map(child => child.name))
                : [type.name];
        }));
    }
}