import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, ConfigurationDocument, Field, CustomFormDefinition, SortUtil, Valuelist } from 'idai-field-core';
import { ErrWithParams } from '../../../import/import/import-documents';
import { ConfigurationIndex } from '../../index/configuration-index';
import { Modals } from '../../../../services/modals';
import { ValuelistEditorModalComponent } from '../../editor/valuelist-editor-modal.component';
import { MenuContext } from '../../../../services/menu-context';


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

    public configurationIndex: ConfigurationIndex;
    public configurationDocument: ConfigurationDocument;
    public clonedConfigurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public field: Field;
    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string) =>
        Promise<ErrWithParams|undefined>;

    public searchTerm: string = '';
    public selectedValuelist: Valuelist|undefined;
    public emptyValuelist: Valuelist|undefined;
    public valuelists: Array<Valuelist> = [];


    constructor(public activeModal: NgbActiveModal,
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
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyValuelistSearch() {

        this.valuelists = ConfigurationIndex.findValuelists(this.configurationIndex, this.searchTerm)
            .filter(valuelist => !this.field.valuelist || valuelist.id !== this.field.valuelist.id)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));

        this.selectedValuelist = this.valuelists?.[0];
        this.emptyValuelist = this.getEmptyValuelist();
    }


    private addValuelist(valuelist: Valuelist) {

        const form: CustomFormDefinition = this.clonedConfigurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name];
        if (!form.valuelists) form.valuelists = {};
        form.valuelists[this.field.name] = valuelist.id;
        this.field.valuelist = valuelist;

        this.activeModal.close();
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
            id: this.searchTerm,
            values: {},
            description: {}
        };
        componentInstance.new = true;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            newConfigurationDocument => this.addNewValuelist(newConfigurationDocument),
            () => this.activeModal.close()
        );
    }


    private addNewValuelist(newConfigurationDocument: ConfigurationDocument) {

        this.clonedConfigurationDocument._rev = newConfigurationDocument._rev;
        this.clonedConfigurationDocument.created = newConfigurationDocument.created;
        this.clonedConfigurationDocument.modified = newConfigurationDocument.modified;
        this.clonedConfigurationDocument.resource.valuelists = newConfigurationDocument.resource.valuelists;

        const valuelist: Valuelist = this.clonedConfigurationDocument.resource.valuelists[this.searchTerm];
        valuelist.id = this.searchTerm;
        
        this.addValuelist(valuelist);
    }


    private getEmptyValuelist(): Valuelist|undefined {

        if (this.searchTerm.length === 0) return undefined;

        return {
            id: this.searchTerm
        } as Valuelist;
    }
}
