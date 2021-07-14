import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal } from 'tsfun';
import { I18N } from 'idai-field-core';
import { Menus } from '../../services/menus';
import { Messages } from '../../messages/messages';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { LanguageConfigurationUtil } from '../../../core/configuration/language-configuration-util';


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
            : '#000';

        if (this.new) {
            this.clonedConfigurationDocument.resource.categories[this.category.name] = {
                color: '#000',
                parent: this.category.parentCategory.name,
                fields: {}
            }
        } else {
            if (!this.getClonedCategoryDefinition().color) {
                this.getClonedCategoryDefinition().color = this.currentColor;
            }
        }
    }


    public async save() {

        if (this.getClonedCategoryDefinition().color ===
                CategoryEditorModalComponent.getHexColor(this.category.defaultColor)) {
            delete this.getClonedCategoryDefinition().color;
        }

        super.save();
    }


    public isChanged(): boolean {

        return this.new
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription)
            || this.getClonedCategoryDefinition().color !== this.currentColor;
    }


    protected getLabel(): I18N.String {

        return this.category.label;
    }


    protected getDescription(): I18N.String {

        return this.category.description;
    }


    protected updateCustomLanguageConfigurations() {

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            this.getClonedLanguageConfigurations(), this.clonedLabel, this.clonedDescription, this.category
        );
    }


    private static getHexColor(color: string): string {

        const canvasContext = document.createElement('canvas').getContext('2d');
        canvasContext.fillStyle = color;

        return canvasContext.fillStyle;
    }
}
