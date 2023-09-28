import { Component, OnChanges, Input } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { isString } from 'tsfun';
import { CategoryForm, Labels, ProjectConfiguration, StringUtils } from 'idai-field-core';

type Color = string;
type Character = string;

@Component({
    selector: 'category-icon',
    template: '<div class="category-icon" [style.width]="pxSize" [style.height]="pxSize" [style.font-size]="pxSize" [style.line-height]="pxSize" [style.background-color]="color">' +
        '<span class="character" [style.color]="textColor">{{character}}</span>' +
    '</div>'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class CategoryIconComponent implements OnChanges {

    @Input() size: number;
    @Input() category: string|CategoryForm;
    @Input() customProjectConfiguration: ProjectConfiguration;

    public character: Character;
    public color: Color;
    public textColor: Color;
    public pxSize: string;


    constructor(private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private i18n: I18n) {}


    ngOnChanges() {

        if (this.category === 'Configuration') {
            this.setValuesForConfigurationCategory();
        } else {
            this.determineCharacterForCategory();
            this.determineColorForCategory();
            this.textColor = CategoryForm.isBrightColor(this.color)
                ? 'black'
                : 'white';
        }
        
        this.pxSize = this.size + 'px';
    }


    private determineCharacterForCategory() {

        this.character = StringUtils.first(
            isString(this.category)
                ? this.labels.get(this.getCategory(this.category))
                : this.labels.get(this.category)
        );
    }


    private determineColorForCategory() {

        this.color = (
            isString(this.category)
                ? this.getCategory(this.category)
                : this.category
        ).color;
    }


    private getCategory(categoryName: string): CategoryForm {

        return this.customProjectConfiguration
            ? this.customProjectConfiguration.getCategory(categoryName)
            : this.projectConfiguration.getCategory(categoryName);
    }


    private setValuesForConfigurationCategory() {

        this.character = this.i18n({
            id: 'navbar.tabs.configuration', value: 'Projektkonfiguration'
        })[1];
        this.color = 'black';
        this.textColor = 'white';
    }
}
