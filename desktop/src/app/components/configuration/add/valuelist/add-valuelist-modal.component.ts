 import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, ConfigurationDocument, Field, CustomFormDefinition, SortUtil, Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { Modals } from '../../../../services/modals';
import { ValuelistEditorModalComponent } from '../../editor/valuelist-editor-modal.component';
import { MenuContext } from '../../../../services/menu-context';
import { SaveResult } from '../../configuration.component';
import { ValuelistSearchQuery } from './valuelist-search-query';


@Component({
    templateUrl: './add-valuelist-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class AddValuelistModalComponent {

    public configurationDocument: ConfigurationDocument;
    public clonedConfigurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public clonedField: Field;
    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string) =>
        Promise<SaveResult>;

    public searchQuery: ValuelistSearchQuery = ValuelistSearchQuery.buildDefaultQuery();
    public selectedValuelist: Valuelist|undefined;
    public emptyValuelist: Valuelist|undefined;
    public valuelists: Array<Valuelist> = [];
    public filteredValuelists: Array<Valuelist> = [];


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals) {}


    public initialize() {

        this.applyValuelistSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public select(valuelist: Valuelist) {

        this.selectedValuelist = valuelist;
    }


    public confirmSelection() {

        if (!this.selectedValuelist) return;

        if (this.selectedValuelist === this.emptyValuelist) {
            this.createNewValuelist();
        } else {
            this.addValuelist(this.selectedValuelist);
            this.activeModal.close();
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public updateSearchQuery(newSearchQuery: ValuelistSearchQuery) {

        this.searchQuery = newSearchQuery;
        this.applyValuelistSearch();
    }


    public applyValuelistSearch() {

        this.valuelists = this.configurationIndex.findValuelists(this.searchQuery.queryString)
            .filter(valuelist => !this.clonedField.valuelist || valuelist.id !== this.clonedField.valuelist.id)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));

        this.filteredValuelists = ValuelistSearchQuery.applyFilters(
            this.searchQuery, this.valuelists, this.configurationIndex
        );

        this.selectedValuelist = this.valuelists?.[0];
        this.emptyValuelist = this.getEmptyValuelist();
    }


    public getFinalizedValuelist(): Valuelist {

        if (!this.selectedValuelist) return;

        return this.selectedValuelist.extendedValuelist
            ? Valuelist.applyExtension(this.selectedValuelist,
                this.configurationIndex.getValuelist(this.selectedValuelist.extendedValuelist))
            : this.selectedValuelist;
    }


    private addValuelist(valuelist: Valuelist) {

        const form: CustomFormDefinition = this.clonedConfigurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name];
        if (!form.valuelists) form.valuelists = {};
        form.valuelists[this.clonedField.name] = valuelist.id;
        this.clonedField.valuelist = this.getFinalizedValuelist();
    }


    private async createNewValuelist() {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.valuelist = {
            id: this.searchQuery.queryString,
            values: {},
            description: {}
        };
        componentInstance.new = true;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult: SaveResult) => this.addNewValuelist(saveResult),
            () => this.activeModal.close()
        );
    }


    private addNewValuelist(saveResult: SaveResult) {

        this.configurationDocument = saveResult.configurationDocument;
        this.clonedConfigurationDocument._rev = this.configurationDocument._rev;
        this.clonedConfigurationDocument.created = this.configurationDocument.created;
        this.clonedConfigurationDocument.modified = this.configurationDocument.modified;
        this.clonedConfigurationDocument.resource.valuelists = this.configurationDocument.resource.valuelists;

        const valuelist: Valuelist = this.clonedConfigurationDocument.resource
            .valuelists[this.searchQuery.queryString];
        valuelist.id = this.searchQuery.queryString;
        
        this.addValuelist(valuelist);
        this.activeModal.close(saveResult);
    }


    private getEmptyValuelist(): Valuelist|undefined {

        if (this.searchQuery.queryString.length === 0) return undefined;

        return {
            id: this.searchQuery.queryString
        } as Valuelist;
    }
}
