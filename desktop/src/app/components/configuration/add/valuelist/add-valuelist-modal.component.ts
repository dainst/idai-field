 import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, CustomFormDefinition, SortUtil,
    Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { Modals } from '../../../../services/modals';
import { ManageValuelistsModalComponent } from './manage-valuelists-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { SubfieldEditorData } from '../../editor/field/subfield-editor-modal.component';
import { ConfigurationUtil } from '../../configuration-util';


@Component({
    templateUrl: './add-valuelist-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:click)': 'onClick($event, false)',
        '(window:contextmenu)': 'onClick($event, true)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class AddValuelistModalComponent extends ManageValuelistsModalComponent {

    public clonedConfigurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public clonedField?: Field;
    public subfieldData?: SubfieldEditorData;


    constructor(activeModal: NgbActiveModal,
                configurationIndex: ConfigurationIndex,
                modals: Modals,
                menus: Menus,
                messages: Messages,
                settingsProvider: SettingsProvider) {

        super(activeModal, configurationIndex, modals, menus, messages, settingsProvider);
    }


    public confirmSelection() {

        if (!this.selectedValuelist) return;

        this.addValuelist(this.selectedValuelist);
        this.activeModal.close();
    }


    public getCurrentValuelistId(): string {

        return this.subfieldData
            ? this.subfieldData.valuelist?.id
            : this.clonedField?.valuelist?.id;
    }


    protected submitQuery(): Array<Valuelist> {
        
        return this.configurationIndex.findValuelists(this.searchQuery.queryString)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));
    }


    protected applyNewValuelistResult(newValuelistId: string) {

        this.clonedConfigurationDocument.resource.valuelists = clone(this.configurationDocument.resource.valuelists);

        const valuelist: Valuelist = clone(this.clonedConfigurationDocument.resource.valuelists[newValuelistId]);
        valuelist.id = newValuelistId;
        
        this.addValuelist(valuelist);
        this.activeModal.close();
    }


    private addValuelist(valuelist: Valuelist) {

        if (this.subfieldData) {
            this.subfieldData.valuelist = this.getCompleteValuelist(valuelist);
        } else {
            const form: CustomFormDefinition = this.clonedConfigurationDocument.resource
                .forms[this.category.libraryId ?? this.category.name];
            if (!form.valuelists) form.valuelists = {};

            form.valuelists[this.clonedField.name] = valuelist.id;
            this.clonedField.valuelist = this.getCompleteValuelist(valuelist);
        }
    }
}
