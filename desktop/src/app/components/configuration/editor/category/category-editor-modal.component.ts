import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { equal, Map, to } from 'tsfun';
import { ConfigurationDocument, I18N, CustomLanguageConfigurations, CategoryForm, CustomFormDefinition, 
    Field, Labels, PrintedField, Named, ProjectConfiguration } from 'idai-field-core';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { ConfigurationEditorModalComponent } from '../configuration-editor-modal.component';
import { ConfigurationUtil } from '../../configuration-util';
import { Modals } from '../../../../services/modals';
import { M } from '../../../messages/m';


@Component({
    templateUrl: './category-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class CategoryEditorModalComponent extends ConfigurationEditorModalComponent {

    public clonedProjectConfiguration: ProjectConfiguration;
    public numberOfCategoryResources: number;
    public printedFields: Array<PrintedField> = [];
    public printableFields: string[] = [];
    public selectableWorkflowRelationTargetCategories: Array<CategoryForm>;

    private currentColor: string;

    protected changeMessage = $localize `:@@configuration.categoryChanged:Die Kategorie wurde geändert.`;


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private labels: Labels) {

        super(activeModal, modals, menuService, messages);
    }


    public isCustomCategory = () => this.category.source === 'custom';

    public isWorkflowSectionVisible = () => this.category.parentCategory?.name === 'WorkflowStep';


    public initialize() {

        super.initialize();

        this.currentColor = this.category.color
            ? CategoryEditorModalComponent.getHexColor(this.category.color)
            : '#000000';

        if (this.new) {
            this.clonedConfigurationDocument.resource.forms[this.category.name] = {
                color: this.category.color,
                parent: this.category.parentCategory.name,
                fields: {},
                groups: CategoryForm.getGroupsConfiguration(
                    this.category,
                    ConfigurationDocument.getPermanentlyHiddenFields(this.category)
                )
            }
        } else {
            if (!this.getClonedFormDefinition().color) {
                this.getClonedFormDefinition().color = this.currentColor;
            }
        }

        this.printedFields = this.getPrintedFields();
        this.printableFields = this.getPrintableFields();

        if (!this.getClonedFormDefinition().references) this.getClonedFormDefinition().references = [];

        this.selectableWorkflowRelationTargetCategories = this.getSelectableWorkflowRelationTargetCategories();
    }


    public async confirm() {

        let resourceLimit: number|undefined;
        try {
            resourceLimit = CategoryEditorModalComponent.cleanUpAndValidateResourceLimit(
                this.getClonedFormDefinition().resourceLimit
            );
            ConfigurationUtil.cleanUpAndValidateReferences(this.getClonedFormDefinition());
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        this.getClonedFormDefinition().resourceLimit = resourceLimit;

        if (this.getClonedFormDefinition().color ===
                CategoryEditorModalComponent.getHexColor(this.category.defaultColor)
                && this.category.libraryId) {
            delete this.getClonedFormDefinition().color;
        }

        this.getClonedFormDefinition().identifierPrefix =
            CategoryEditorModalComponent.cleanUpInputText(this.getClonedFormDefinition().identifierPrefix);

        if (this.new) {
            this.clonedConfigurationDocument = ConfigurationDocument.addToCategoriesOrder(
                this.clonedConfigurationDocument,
                this.category.name,
                this.category.parentCategory?.name
            );
        }

        this.updatePrintedFieldsInClonedFormDefinition();

        await super.confirm();
    }


    public isChanged(): boolean {

        return this.new
            || !equal(this.label)(I18N.removeEmpty(this.clonedLabel))
            || !equal(this.description)(I18N.removeEmpty(this.clonedDescription))
            || this.hasIdentifierPrefixChanged()
            || this.hasResourceLimitChanged()
            || this.getClonedFormDefinition().color.toLowerCase() !== this.currentColor.toLowerCase()
            || this.hasScanCodesConfigurationChanged()
            || this.hasWorkflowConfigurationChanged()
            || ConfigurationUtil.isReferencesArrayChanged(this.getCustomFormDefinition(),
                this.getClonedFormDefinition());
    }


    public isRestoreColorButtonVisible(): boolean {

        return this.getClonedFormDefinition().color
            && this.getClonedFormDefinition().color
                !== CategoryEditorModalComponent.getHexColor(this.category.defaultColor)
            && this.category.libraryId !== undefined;
    }


    public restoreDefaultColor() {

        this.getClonedFormDefinition().color = CategoryEditorModalComponent.getHexColor(
            this.category.defaultColor
        );
    }


    public isIdentifierPrefixWarningShown() {
        
        return this.hasIdentifierPrefixChanged() && this.numberOfCategoryResources > 0;
    }


    public isScanCodesOptionEnabled() {
        
        return !this.category.parentCategory?.scanCodes;
    }

    
    public isScanCodeAutoCreationOptionEnabled(): boolean {

        return this.isScanCodeUsageActivated()
           && !this.category.parentCategory?.scanCodes?.autoCreate;
    }


    public isPrintedFieldsSlotEnabled(index: number): boolean {

        return this.isScanCodeUsageActivated()
            && !(this.category.parentCategory?.scanCodes?.printedFields ?? []).includes(this.printedFields[index]);
    }


    public isScanCodeUsageActivated() {
        
        return this.getClonedFormDefinition().scanCodes !== undefined
            || this.category.parentCategory?.scanCodes !== undefined;
    }

    
    public isScanCodeAutoCreationActivated() {
        
        return this.getClonedFormDefinition().scanCodes?.autoCreate
            || this.category.parentCategory?.scanCodes?.autoCreate;   
    }


    public isPrintedFieldsSlotActivated(index: number): boolean {

        return this.isPrintedFieldsSlotEnabled(index) && this.printedFields.length > index;
    }


    public isScanCodesOptionAvailable(): boolean {
        
        return !this.category.isAbstract
            && (this.category.scanCodesAllowed || this.category.parentCategory?.scanCodesAllowed);
    }


    public isIdentifierPrefixOptionAvailable(): boolean {
        
        return !this.category.isAbstract
            && this.category.name !== 'Project'
            && this.category.name !== 'Image'
            && this.category.parentCategory?.name !== 'Image';
    }


    public isResourceLimitAvailable(): boolean {
        
        return !this.category.isAbstract
            && (this.category.name === 'Place'
                || this.category.parentCategory?.name === 'Operation');
    }


    public isResourceLimitWarningShown() {
        
        if (!this.hasResourceLimitChanged()) return false;
        
        try {
            const resourceLimit: number|undefined = CategoryEditorModalComponent.cleanUpAndValidateResourceLimit(
                this.getClonedFormDefinition().resourceLimit
            );
            return this.numberOfCategoryResources > resourceLimit;
        } catch (_) {
            return false;
        }
    }


    public toggleScanCodes() {
        
        const clonedFormDefinition: CustomFormDefinition = this.getClonedFormDefinition();

        if (clonedFormDefinition.scanCodes) {
            delete clonedFormDefinition.scanCodes;
            this.printedFields = [];
        } else {
            clonedFormDefinition.scanCodes = {
                type: 'qr',
                autoCreate: false,
                printedFields: []
            };
        }
    }


    public toggleAutoCreateScanCodes() {

        const clonedFormDefinition: CustomFormDefinition = this.getClonedFormDefinition();
        if (clonedFormDefinition.scanCodes) {
            clonedFormDefinition.scanCodes.autoCreate = !clonedFormDefinition.scanCodes.autoCreate;
            if (!clonedFormDefinition.scanCodes.autoCreate && this.category.parentCategory.scanCodes) {
                delete clonedFormDefinition.scanCodes;
            }
        } else if (this.category.parentCategory?.scanCodes) {
            clonedFormDefinition.scanCodes = {
                type: this.category.parentCategory.scanCodes.type,
                autoCreate: true,
                printedFields: []
            };
        }
    }


    public setPrintedField(fieldName: string, index: number) {

        if (fieldName) {
            if (this.printedFields[index]) {
                this.printedFields[index].name = fieldName;
            } else {
                this.printedFields[index] = {
                    name: fieldName,
                    printLabel: true
                };
            }
        } else {
            this.printedFields.splice(index, 1);
        }
    }


    public isPrintLabelOptionActivated(index: number) {

        return this.printedFields[index]?.printLabel;
    }


    public togglePrintLabelOption(index: number) {

        this.printedFields[index].printLabel = !this.printedFields[index].printLabel;
    }

    
    public isSelectedPrintedField(fieldName: string, index: number) {

        return this.printedFields[index]?.name === fieldName;
    }


    public getPrintableFieldsForSlot(index: number): string[] {

        return this.printableFields.filter(fieldName => {
            return !this.printedFields.map(to(Named.NAME)).includes(fieldName)
                || this.isSelectedPrintedField(fieldName, index);
        });
    }


    public getFieldLabel(fieldName: string) {

        switch (fieldName) {
            case 'isRecordedIn':
                return this.labels.get(this.clonedProjectConfiguration.getCategory('Operation'));
            case 'liesWithin':
                return $localize `:@@qrCode.printedFields.liesWithin:Übergeordnete Ressource`;
            default:
                return this.labels.getFieldLabel(this.category, fieldName);
        }
    }


    public getTooltip(option: 'scanCodes'|'autoCreation'|'printedField'|'printedFieldLabel', index?: number): string {

        if ((option === 'scanCodes' && !this.isScanCodesOptionEnabled()
                || option === 'autoCreation' && this.category.parentCategory?.scanCodes?.autoCreate)) {
            return $localize `:@@configuration.cannotDisableParentOption:Diese Option ist für die Oberkategorie aktiviert und kann für die aktuelle Kategorie nicht ausgeschaltet werden.`;
        } else if ((option === 'autoCreation' && !this.isScanCodeAutoCreationOptionEnabled())
                || ['printedField', 'printedFieldLabel'].includes(option) && !this.isScanCodeUsageActivated()) {
            return $localize `:@@configuration.autoCreationOptionDisabled:Aktivieren Sie die Option "QR-Codes zur Identifikation verwenden", um diese Option zu verwenden.`;
        } else if (['printedField', 'printedFieldLabel'].includes(option) && !this.isPrintedFieldsSlotEnabled(index)) {
            return $localize `:@@configuration.printedFieldSlotDisabled:Dieses Feld wurde für die Oberkategorie ausgewählt und kann für die aktuelle Kategorie nicht bearbeitet werden.`;
        } else if (option === 'printedFieldLabel' && !this.isPrintedFieldsSlotActivated(index)){
            return $localize `:@@configuration.printedFieldUnselected:Wählen Sie ein Feld aus, um diese Option zu verwenden.`;
        } else {
            return '';
        }
    }


    public toggleWorkflowRelationTargetCategory(category: CategoryForm, relationName: string) {

        const categoryNames: string[] = [category.name].concat(
            category.children ? category.children.map(childCategory => childCategory.name) : []
        );
        const clonedFormDefinition: CustomFormDefinition = this.getClonedFormDefinition();

        if (clonedFormDefinition?.range?.[relationName]?.includes(category.name)) {
            clonedFormDefinition.range[relationName] = clonedFormDefinition.range[relationName]
                .filter(categoryName => {
                    return !categoryNames.includes(categoryName)
                        && category.parentCategory?.name !== categoryName;
                });
            if (!clonedFormDefinition.range[relationName].length) delete clonedFormDefinition.range[relationName];
            if (!Object.keys(clonedFormDefinition.range).length) delete clonedFormDefinition.range;
        } else {
            if (!clonedFormDefinition.range) clonedFormDefinition.range = {};
            if (!clonedFormDefinition.range[relationName]) clonedFormDefinition.range[relationName] = [];
            clonedFormDefinition.range[relationName] = clonedFormDefinition.range[relationName].concat(categoryNames);
        }
    }


    private getPrintedFields(): Array<PrintedField> {

        return (this.category.parentCategory?.scanCodes?.printedFields ?? [])
            .concat(this.getCustomFormDefinition()?.scanCodes?.printedFields ?? []);
    }


    private getPrintableFields(): string[] {

        const forbiddenInputTypes: Array<Field.InputType> = [
            Field.InputType.IDENTIFIER,
            Field.InputType.GEOMETRY,
            Field.InputType.INSTANCE_OF,
            Field.InputType.RELATION,
            Field.InputType.DERIVED_RELATION,
            Field.InputType.IDENTIFIER,
            Field.InputType.NONE
        ];

        const categoryFields = CategoryForm.getFields(this.category)
            .filter(field => !forbiddenInputTypes.includes(field.inputType))
            .map(field => field.name);

        return this.getDefaultPrintableFields().concat(categoryFields);
    }


    private getDefaultPrintableFields(): string[] {

        const defaultFields: string[] = ['liesWithin'];
        if (this.clonedProjectConfiguration.getRegularCategories().includes(this.category)) {
            defaultFields.push('isRecordedIn');
        }

        return defaultFields;
    }


    private updatePrintedFieldsInClonedFormDefinition() {

        const parentFieldNames: string[] = this.category.parentCategory?.scanCodes?.printedFields?.map(to(Named.NAME))
            ?? [];
        const printedFields: Array<PrintedField>= this.printedFields.filter(field => {
            return !parentFieldNames.includes(field.name);
        });

        const clonedFormDefinition: CustomFormDefinition = this.getClonedFormDefinition();

        if (clonedFormDefinition.scanCodes) {
            clonedFormDefinition.scanCodes.printedFields = printedFields;
        } else if (printedFields.length > 0) {
            clonedFormDefinition.scanCodes = {
                type: 'qr',
                autoCreate: this.category.parentCategory?.scanCodes?.autoCreate ?? false,
                printedFields: printedFields
            };
        }
    }


    private getSelectableWorkflowRelationTargetCategories(): Array<CategoryForm> {

        return this.clonedProjectConfiguration.getTopLevelCategories().filter(category => {
            return !['Project', 'Operation', 'Place', 'TypeCatalog', 'Type', 'StoragePlace', 'WorkflowStep', 'Image']
                .includes(category.name);
        });
    } 


    protected getLabel(): I18N.String {

        return this.category.label;
    }


    protected getDescription(): I18N.String {

        return this.category.description;
    }


    protected updateCustomLanguageConfigurations() {

        CustomLanguageConfigurations.update(
            this.getClonedLanguageConfigurations(), this.clonedLabel, this.clonedDescription, this.category
        );
    }


    private hasIdentifierPrefixChanged(): boolean {

        return CategoryEditorModalComponent.cleanUpInputText(this.getClonedFormDefinition().identifierPrefix)
            !== this.getCustomFormDefinition()?.identifierPrefix;
    }


    private hasResourceLimitChanged(): boolean {

        return CategoryEditorModalComponent.cleanUpResourceLimit(this.getClonedFormDefinition().resourceLimit)
            !== this.getCustomFormDefinition()?.resourceLimit;
    }


    private hasScanCodesConfigurationChanged(): boolean {

        const clonedScanCodes = (this.getClonedFormDefinition().scanCodes ?? {}) as Map<any>;
        const customScanCodes = (this.getCustomFormDefinition()?.scanCodes ?? {}) as Map<any>;

        return !equal(clonedScanCodes)(customScanCodes)
            || !equal(this.printedFields)(this.getPrintedFields());
    }


    private hasWorkflowConfigurationChanged(): boolean {

        const clonedRange = this.getClonedFormDefinition().range ?? {};
        const customRange = this.getCustomFormDefinition().range ?? {};

        return !equal(clonedRange)(customRange);
    }


    private static cleanUpInputText(inputText: string|undefined): string|undefined {

        if (!inputText) return undefined;

        const result: string|undefined = inputText.trim();
        return result.length > 0 ? result : undefined;
    }


    private static cleanUpResourceLimit(resourceLimit: string|number): number|undefined {

        const cleanedUpText: string|undefined = this.cleanUpInputText(resourceLimit?.toString());
        if (!cleanedUpText) return undefined;

        return parseInt(cleanedUpText);
    }


    private static cleanUpAndValidateResourceLimit(resourceLimit: string|number): number|undefined {

        const cleanedUpResourceLimit = this.cleanUpResourceLimit(resourceLimit);

        if (cleanedUpResourceLimit === undefined) {
            return undefined;
        } else if (isNaN(cleanedUpResourceLimit)) {
            throw [M.CONFIGURATION_ERROR_INVALID_RESOURCE_LIMIT_NOT_A_NUMBER];
        } else if (cleanedUpResourceLimit < 1) {
            throw [M.CONFIGURATION_ERROR_INVALID_RESOURCE_LIMIT_TOO_LOW];
        }

        return cleanedUpResourceLimit;
    }


    private static getHexColor(color: string): string {

        const canvasContext = document.createElement('canvas').getContext('2d');
        canvasContext.fillStyle = color;

        return canvasContext.fillStyle;
    }
}
