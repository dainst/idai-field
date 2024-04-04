import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { clone, nop } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, Valuelist } from 'idai-field-core';
import { AddValuelistModalComponent } from '../../../add/valuelist/add-valuelist-modal.component';
import { Modals } from '../../../../../services/modals';
import { MenuContext } from '../../../../../services/menu-context';
import { ConfigurationIndex } from '../../../../../services/configuration/index/configuration-index';
import { AngularUtility } from '../../../../../angular/angular-utility';
import { ValuelistEditorModalComponent } from '../../valuelist/valuelist-editor-modal.component';
import { SubfieldEditorData } from '../subfield-editor-modal.component';


@Component({
    selector: 'valuelist-selector',
    templateUrl: './valuelist-selector.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistSelectorComponent implements OnChanges {

    @Input() inputType: Field.InputType;
    @Input() configurationDocument: ConfigurationDocument;
    @Input() clonedConfigurationDocument: ConfigurationDocument;
    @Input() category: CategoryForm;
    @Input() clonedField?: Field;
    @Input() subfieldData?: SubfieldEditorData;
    @Input() applyChanges: (configurationDocument: ConfigurationDocument, reindexConfiguration?: boolean) =>
        Promise<void>;
    @Input() disabled: boolean;

    @Output() onChanged: EventEmitter<string> = new EventEmitter<string>();

  
    constructor(private modals: Modals,
                private configurationIndex: ConfigurationIndex) {}

    
    ngOnChanges() {
    
        this.updateValuelist();
    }

    
    public isEditValuelistButtonVisible(): boolean {
     
        return this.getSelectedValuelist() !== undefined
            && this.clonedConfigurationDocument.resource.valuelists?.[this.getSelectedValuelistId()] !== undefined;
    }


    public getSelectedValuelist(): Valuelist|undefined {

        return this.subfieldData
            ? this.subfieldData.valuelist
            : this.clonedField?.valuelist;
    }


    public getSelectedValuelistId(): string|undefined {

        return this.getSelectedValuelist()?.id;
    }


    public async selectValuelist() {

        const [result, componentInstance] = this.modals.make<AddValuelistModalComponent>(
            AddValuelistModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.category = this.category;
        componentInstance.clonedField = this.clonedField;
        componentInstance.subfieldData = this.subfieldData;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            nop,
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async editValuelist() {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_VALUELIST_EDIT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = this.getSelectedValuelist();
        if (componentInstance.valuelist.extendedValuelist) {
            componentInstance.extendedValuelist
                = this.configurationIndex.getValuelist(componentInstance.valuelist.extendedValuelist);
        }
        componentInstance.openedFromFieldEditor = true;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => {
                this.clonedConfigurationDocument.resource.valuelists
                    = clone(this.configurationDocument.resource.valuelists);
                this.updateValuelist();
            },
            nop
        );

        AngularUtility.blurActiveElement();
    }


    private updateValuelist() {

        const valuelistId: string = this.getSelectedValuelistId();
        if (!valuelistId) return;
        
        let valuelist: Valuelist = clone(this.clonedConfigurationDocument.resource.valuelists[valuelistId]);
        if (!valuelist) return;

        valuelist.id = valuelistId;

        if (valuelist.extendedValuelist) {
            valuelist = Valuelist.applyExtension(
                valuelist,
                this.configurationIndex.getValuelist(valuelist.extendedValuelist)
            );
        }

        if (this.subfieldData) {
            this.subfieldData.valuelist = valuelist;
        } else {
            this.clonedField.valuelist = valuelist;
        }
    }
}
