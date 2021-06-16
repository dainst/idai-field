import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { flatten, to } from 'tsfun';
import { Category, ConfigurationDocument, CustomFieldDefinition, FieldDefinition, ValuelistDefinition,
    ValuelistUtil, Document, LabelUtil } from 'idai-field-core';
import { MenuContext, MenuService } from '../menu-service';
import { FieldEditorModalComponent } from './editor/field-editor-modal.component';
import { ConfigurationChange } from '../../core/configuration/configuration-change';


const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


export type InputType = {
    name: string;
    label: string;
};


@Component({
    selector: 'configuration-field',
    templateUrl: './configuration-field.html'
})
/**
* @author Sebastian Cuy
* @author Thomas Kleinke
 */
export class ConfigurationFieldComponent implements OnChanges {

    @Input() category: Category;
    @Input() field: FieldDefinition;
    @Input() customConfigurationDocument: ConfigurationDocument;
    @Input() hidden: boolean;

    @Output() onEdited: EventEmitter<ConfigurationChange> = new EventEmitter<ConfigurationChange>();

    public parentField: boolean = false;
    public customFieldDefinitionClone: CustomFieldDefinition | undefined;
    public editable: boolean = false;

    public label: string;
    public description: string;


    public availableInputTypes: Array<InputType> = [
        { name: 'input', label: this.i18n({ id: 'config.inputType.input', value: 'Einzeiliger Text' }) },
        { name: 'multiInput', label: this.i18n({ id: 'config.inputType.multiInput', value: 'Einzeiliger Text mit Mehrfachauswahl' }) },
        { name: 'text', label: this.i18n({ id: 'config.inputType.text', value: 'Mehrzeiliger Text' }) },
        { name: 'unsignedInt', label: this.i18n({ id: 'config.inputType.unsignedInt', value: 'Positive Ganzzahl' }) },
        { name: 'float', label: this.i18n({ id: 'config.inputType.float', value: 'Kommazahl' }) },
        { name: 'unsignedFloat', label: this.i18n({ id: 'config.inputType.unsignedFloat', value: 'Positive Kommazahl' }) },
        { name: 'dropdown', label: this.i18n({ id: 'config.inputType.dropdown', value: 'Dropdown-Liste' }) },
        { name: 'dropdownRange', label: this.i18n({ id: 'config.inputType.dropdownRange', value: 'Dropdown-Liste (Bereich)' }) },
        { name: 'radio', label: this.i18n({ id: 'config.inputType.radio', value: 'Radiobutton' }) },
        { name: 'boolean', label: this.i18n({ id: 'config.inputType.boolean', value: 'Ja / Nein' }) },
        { name: 'checkboxes', label: this.i18n({ id: 'config.inputType.checkboxes', value: 'Checkboxen' }) },
        { name: 'dating', label: this.i18n({ id: 'config.inputType.dating', value: 'Datierungsangabe' }) },
        { name: 'date', label: this.i18n({ id: 'config.inputType.date', value: 'Datum' }) },
        { name: 'dimension', label: this.i18n({ id: 'config.inputType.dimension', value: 'Maßangabe' }) },
        { name: 'literature', label: this.i18n({ id: 'config.inputType.literature', value: 'Literaturangabe' }) },
        { name: 'geometry', label: this.i18n({ id: 'config.inputType.geometry', value: 'Geometrie' }) },
        { name: 'instanceOf', label: this.i18n({ id: 'config.inputType.instanceOf', value: 'Typenauswahl' }) },
    ];


    constructor(private modalService: NgbModal,
                private menuService: MenuService,
                private i18n: I18n) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = this.isParentField();
        this.updateLabelAndDescription();
    }


    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public getCustomLanguageConfigurations = () => this.customConfigurationDocument.resource.languages;

    public isCustomField = () => this.field.source === 'custom';


    public getCustomFieldDefinition(): CustomFieldDefinition|undefined {

        return this.customConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name]
            .fields[this.field.name];
    }


    public async edit() {

        this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);

        const modalReference: NgbModalRef = this.modalService.open(
            FieldEditorModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.customConfigurationDocument = this.customConfigurationDocument;
        modalReference.componentInstance.category = this.category;
        modalReference.componentInstance.field = this.field;
        modalReference.componentInstance.availableInputTypes = this.availableInputTypes;
        modalReference.componentInstance.initialize();

        try {
            this.onEdited.emit(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    public getInputTypeLabel(): string {

        return this.availableInputTypes
            .find(inputType => inputType.name === this.field.inputType)
            .label;
    }


    private updateLabelAndDescription() {

        const { label, description } = LabelUtil.getLabelAndDescription(this.field);
        this.label = label;
        this.description = description;
    }


    private isParentField(): boolean {

        if (!this.category.parentCategory) return false;

        return flatten(this.category.parentCategory.groups.map(to('fields')))
            .map(to('name'))
            .includes(this.field.name);
    }
}
