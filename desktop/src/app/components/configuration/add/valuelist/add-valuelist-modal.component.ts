import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, ConfigurationDocument, Field, CustomFormDefinition, SortUtil, Valuelist } from 'idai-field-core';
import { ErrWithParams } from '../../../import/import/import-documents';
import { ConfigurationIndex } from '../../index/configuration-index';


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
    public clonedConfigurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public field: Field;
    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string) =>
        Promise<ErrWithParams|undefined>;

    public searchTerm: string = '';
    public selectedValuelist: Valuelist|undefined;
    public valuelists: Array<Valuelist> = [];


    constructor(public activeModal: NgbActiveModal) {}


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

        this.addSelectedValuelist();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyValuelistSearch() {

        this.valuelists = ConfigurationIndex.findValuelists(this.configurationIndex, this.searchTerm)
            .filter(valuelist => !this.field.valuelist || valuelist.id !== this.field.valuelist.id)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));

        this.selectedValuelist = this.valuelists?.[0];
    }


    private addSelectedValuelist() {

        const form: CustomFormDefinition = this.clonedConfigurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name];
        if (!form.valuelists) form.valuelists = {};
        form.valuelists[this.field.name] = this.selectedValuelist.id;
        this.field.valuelist = this.selectedValuelist;

        this.activeModal.close();
    }
}
