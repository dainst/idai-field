import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal } from 'tsfun';
import { ConfigurationDocument, I18N, CustomLanguageConfigurations, CategoryForm,
    CustomFormDefinition } from 'idai-field-core';
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
    }
})
/**
 * @author Thomas Kleinke
 */
export class CategoryEditorModalComponent extends ConfigurationEditorModalComponent {

    public numberOfCategoryResources: number;

    private currentColor: string;

    protected changeMessage = this.i18n({
        id: 'configuration.categoryChanged', value: 'Die Kategorie wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private i18n: I18n) {

        super(activeModal, modals, menuService, messages);
    }


    public isCustomCategory = () => this.category.source === 'custom';

    public isIdentifierPrefixWarningShown = () => this.hasIdentifierPrefixChanged() && this.numberOfCategoryResources > 0;

    public isUseScanCodeToggled = () => this.getClonedFormDefinition().useScanCode === 'qr';


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

        if (!this.getClonedFormDefinition().references) this.getClonedFormDefinition().references = [];
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

        await super.confirm();
    }


    public isChanged(): boolean {

        return this.new
            || !equal(this.label)(I18N.removeEmpty(this.clonedLabel))
            || !equal(this.description)(I18N.removeEmpty(this.clonedDescription))
            || this.hasIdentifierPrefixChanged()
            || this.hasResourceLimitChanged()
            || this.getClonedFormDefinition().color.toLowerCase() !== this.currentColor.toLowerCase()
            || this.getClonedFormDefinition().useScanCode !== this.getCustomFormDefinition().useScanCode
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


    public isIdentificationCustomizationAvailable(): boolean {
        
        return !this.category.isAbstract
            && this.category.name !== 'Project'
            && this.category.name !== 'Image'
            && this.category.parentCategory?.name !== 'Image';
    }


    public isResourceLimitAvailable(): boolean {
        
        return !this.category.isAbstract
            && (this.category.name === 'Place' || this.category.parentCategory?.name === 'Operation');
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


    public toggleUseScanCode() {
        
        const clonedFormDefinition: CustomFormDefinition = this.getClonedFormDefinition();

        if (clonedFormDefinition.useScanCode) {
            delete clonedFormDefinition.useScanCode;
        } else {
            clonedFormDefinition.useScanCode = 'qr';
        }
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
