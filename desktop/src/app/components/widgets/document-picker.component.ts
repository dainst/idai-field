import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import * as tsfun from 'tsfun';
import { CategoryForm, Query, Datastore, Constraint, Document, ConfigurationDocument } from 'idai-field-core';
import { Loading } from './loading';
import { AngularUtility } from '../../angular/angular-utility';
import { Messages } from '../messages/messages';
import { getDocumentSuggestions } from './get-document-suggestions';
import { scrollTo } from '../../angular/scrolling';


@Component({
    selector: 'document-picker',
    templateUrl: './document-picker.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
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
    @Input() showConfigurationOption: boolean = false;
    @Input() showInventoryRegisterOption: boolean = false;
    @Input() showLoadingIcon: boolean = false;
    @Input() includeBrokenDocuments: boolean = false;
    @Input() limit: number = 50;
    @Input() waitForUserInput: boolean = true;
    @Input() markSelected: boolean = false;
    @Input() autoSelect: boolean = false;
    @Input() allowKeyboardNavigation: boolean = false;
    @Input() showNoQueryMessage: boolean = true;
    @Input() preselectedDocumentId: string;

    @Output() documentSelected: EventEmitter<Document> = new EventEmitter<Document>();
    @Output() documentDoubleClicked: EventEmitter<Document> = new EventEmitter<Document>();

    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;

    public documents: Array<Document>;
    public selectedDocument: Document|undefined;

    private query: Query = {};
    private currentQueryId: string;


    constructor(private datastore: Datastore,
                private loading: Loading,
                private messages: Messages) {}


    public isLoading = () => this.loading.isLoading('documentPicker');

    public isLoadingIconVisible = () => this.showLoadingIcon && this.isLoading();

    public getElementId = (document: Document) => 'document-picker-resource-' + document.resource.identifier;

    public trackDocument = (_: number, document: Document) => document.resource.id;

    public getHeight = () => this.documents.length * 58;


    async ngOnChanges(changes: SimpleChanges) {

        if (Object.keys(changes).length === 1 && changes['allowKeyboardNavigation'] !== undefined) return;

        this.query.categories = this.getAllAvailableCategoryNames();
        await this.updateResultList();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (!this.isKeyboardNavigationEnabled()) return;

        if (event.key === 'ArrowUp') {
            this.selectPrevious();
            await this.scrollToDocument(this.selectedDocument);
        } else if (event.key === 'ArrowDown') {
            this.selectNext();
            await this.scrollToDocument(this.selectedDocument, true);
        }
    }


    public select(document: Document) {

        this.selectedDocument = document;
        this.documentSelected.emit(document);
    }


    public doubleClick(document: Document) {

        this.documentDoubleClicked.emit(document);
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
            if (this.autoSelect) await this.performAutoSelection();
        }
    }


    private async performAutoSelection() {

        const documentToSelect: Document = this.getAutoSelectionTargetDocument();

        this.select(documentToSelect);
        if (documentToSelect) await this.scrollToDocument(documentToSelect);

        this.preselectedDocumentId = undefined;
    }


    private getAutoSelectionTargetDocument(): Document {

        const selectedDocumentId: string|undefined = this.selectedDocument
            ? this.selectedDocument.resource.id
            : this.preselectedDocumentId;

        let documentToSelect: Document = undefined;
        if (selectedDocumentId) {
            documentToSelect = this.documents.find(document => document.resource.id === selectedDocumentId);
        }
        if (!documentToSelect && this.documents.length > 0) documentToSelect = this.documents[0];

        return documentToSelect;
    }


    private selectPrevious() {

        if (!this.selectedDocument) return this.selectFirst();

        let index: number = this.documents.indexOf(this.selectedDocument) - 1;
        if (index < 0) index = this.documents.length - 1;
        
        this.select(this.documents[index]);
    }


    private selectNext() {

        if (!this.selectedDocument) return this.selectFirst();

        let index: number = this.documents.indexOf(this.selectedDocument) + 1;
        if (index >= this.documents.length) index = 0;
        
        this.select(this.documents[index]);
    }


    private selectFirst() {

        if (!this.documents.length) return;
        
        return this.select(this.documents[0]);
    }


    private async scrollToDocument(scrollTarget: Document, bottomElement: boolean = false) {

        await AngularUtility.refresh();
        const index: number = this.documents.indexOf(scrollTarget);
        await scrollTo(index, this.getElementId(scrollTarget), 58, this.scrollViewport, bottomElement);
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
            const documents = await getDocumentSuggestions(this.datastore, query, this.includeBrokenDocuments);
            if (this.currentQueryId === queryId) this.documents = this.filterDocuments(documents as Array<Document>);
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            this.loading.stop('documentPicker');
        }
    }


    private getAllAvailableCategoryNames(): string[] {

        const result: string[] = tsfun.union(this.filterOptions.map(category => {
            return category.children
                ? [category.name].concat(category.children.map(child => child.name))
                : [category.name];
        }));

        return this.includeBrokenDocuments
            ? result.concat(['UNCONFIGURED'])
            : result;
    }


    private getProjectOption(): Document {

        return {
            resource: {
                id: 'project',
                identifier: $localize `:@@widgets.documentPicker.project:Projekt`,
                category: 'Project'
            }
        } as any;
    }


    private getConfigurationOption(): ConfigurationDocument {

        return {
            resource: {
                id: 'configuration',
                identifier: $localize `:@@navbar.tabs.configuration:Projektkonfiguration`,
                category: 'Configuration'
            }
        } as any;
    }


    private getInventoryRegisterOption(): ConfigurationDocument {

        return {
            resource: {
                id: 'inventoryRegister',
                identifier: $localize `:@@util.inventoryRegister:Inventarverzeichnis`,
                category: 'InventoryRegister'
            }
        } as any;
    }


    private isProjectOptionVisible(): boolean {

        return this.showProjectOption
            && this.isCategoryOptionVisible(
                'Project',
                $localize `:@@widgets.documentPicker.project:Projekt`
            );
    }


    private isConfigurationOptionVisible(): boolean {

        return this.showConfigurationOption
            && this.isCategoryOptionVisible(
                'Configuration',
                $localize `:@@navbar.tabs.configuration:Projektkonfiguration`
            );
    }


    private isInventoryRegisterOptionVisible(): boolean {

        return this.showInventoryRegisterOption
            && this.isCategoryOptionVisible(
                'InventoryRegister',
                $localize `:@@util.inventoryRegister:Inventarverzeichnis`
            );
    }


    private isCategoryOptionVisible(categoryName: string, categoryLabel: string): boolean {

        return (!this.query.q?.length || categoryLabel.toLowerCase().startsWith(this.query.q.toLowerCase()))
            && (!this.query.categories || this.query.categories.includes(categoryName));
    }


    private filterDocuments(documents: Array<Document>): Array<Document> {

        const result: Array<Document> = [];
        if (this.isConfigurationOptionVisible()) result.push(this.getConfigurationOption());
        if (this.isProjectOptionVisible()) result.push(this.getProjectOption());
        if (this.isInventoryRegisterOptionVisible()) result.push(this.getInventoryRegisterOption());

        return result.concat(
            documents.filter(document => {
                return !this.showProjectOption || !['Project'].includes(document.resource.category);
            })
        );
    }


    private isKeyboardNavigationEnabled(): boolean {

        return this.allowKeyboardNavigation && !document.getElementById('filter-menu');
    }
}
