 import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, CustomFormDefinition, SortUtil,
    Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { Modals } from '../../../../services/modals';
import { SaveResult } from '../../configuration.component';
import { ManageValuelistsModalComponent } from './manage-valuelists-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';


@Component({
    templateUrl: './add-valuelist-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:click)': 'onClick($event, false)',
        '(window:contextmenu)': 'onClick($event, true)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class AddValuelistModalComponent extends ManageValuelistsModalComponent {

    public clonedConfigurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public clonedField: Field;


    constructor(activeModal: NgbActiveModal,
                configurationIndex: ConfigurationIndex,
                modals: Modals,
                menus: Menus,
                messages: Messages) {

        super(activeModal, configurationIndex, modals, menus, messages);
    }


    public confirmSelection() {

        if (!this.selectedValuelist) return;

        this.addValuelist(this.selectedValuelist);
        this.activeModal.close();
    }


    protected submitQuery(): Array<Valuelist> {
        
        return this.configurationIndex.findValuelists(this.searchQuery.queryString)
            .filter(valuelist => !this.clonedField.valuelist || valuelist.id !== this.clonedField.valuelist.id)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));
    }


    protected applyNewValuelistSaveResult(saveResult: SaveResult, newValuelistId: string) {

        this.configurationDocument = saveResult.configurationDocument;
        this.clonedConfigurationDocument._rev = this.configurationDocument._rev;
        this.clonedConfigurationDocument.created = this.configurationDocument.created;
        this.clonedConfigurationDocument.modified = this.configurationDocument.modified;
        this.clonedConfigurationDocument.resource.valuelists = this.configurationDocument.resource.valuelists;

        const valuelist: Valuelist = clone(this.clonedConfigurationDocument.resource.valuelists[newValuelistId]);
        valuelist.id = newValuelistId;
        
        this.addValuelist(valuelist);
        this.activeModal.close(saveResult);
    }


    private addValuelist(valuelist: Valuelist) {

        const form: CustomFormDefinition = this.clonedConfigurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name];
        if (!form.valuelists) form.valuelists = {};
        form.valuelists[this.clonedField.name] = valuelist.id;
        this.clonedField.valuelist = this.getCompleteValuelist(valuelist);
    }
}
