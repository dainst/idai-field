import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal } from 'tsfun';
import { I18N } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { CustomLanguageConfigurations } from '../../../core/configuration/custom-language-configurations';
import { ConfigurationUtil } from '../../../core/configuration/configuration-util';


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

    private currentColor: string;

    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.categoryChanged', value: 'Die Kategorie wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modalService: NgbModal,
                menuService: Menus,
                messages: Messages,
                private i18n: I18n) {

        super(activeModal, modalService, menuService, messages);
    }


    public initialize() {

        super.initialize();

        this.currentColor = this.category.color
            ? CategoryEditorModalComponent.getHexColor(this.category.color)
            : '#000000';

        if (this.new) {
            this.clonedConfigurationDocument.resource.categories[this.category.name] = {
                color: this.category.color,
                parent: this.category.parentCategory.name,
                fields: {},
                groups: ConfigurationUtil.createGroupsConfiguration(
                    this.category,
                    ConfigurationUtil.getPermanentlyHiddenFields(this.configurationDocument, this.category)
                )
            }
        } else {
            if (!this.getClonedCategoryDefinition().color) {
                this.getClonedCategoryDefinition().color = this.currentColor;
            }
        }
    }


    public async save() {

        if (this.getClonedCategoryDefinition().color ===
                CategoryEditorModalComponent.getHexColor(this.category.defaultColor)
                && this.category.libraryId) {
            delete this.getClonedCategoryDefinition().color;
        }

        if (this.new) {
            this.clonedConfigurationDocument.resource.order = ConfigurationUtil.addToCategoriesOrder(
                this.clonedConfigurationDocument.resource.order,
                this.category.name,
                this.category.parentCategory?.name
            );
        }

        await super.save(this.new);
    }


    public isChanged(): boolean {

        return this.new
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription)
            || this.getClonedCategoryDefinition().color !== this.currentColor;
    }


    public isRestoreColorButtonVisible(): boolean {

        return this.getClonedCategoryDefinition().color
            && this.getClonedCategoryDefinition().color
                !== CategoryEditorModalComponent.getHexColor(this.category.defaultColor)
            && this.category.libraryId !== undefined;
    }


    public restoreDefaultColor() {

        this.getClonedCategoryDefinition().color = CategoryEditorModalComponent.getHexColor(
            this.category.defaultColor
        );
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


    private static getHexColor(color: string): string {

        const canvasContext = document.createElement('canvas').getContext('2d');
        canvasContext.fillStyle = color;

        return canvasContext.fillStyle;
    }
}
