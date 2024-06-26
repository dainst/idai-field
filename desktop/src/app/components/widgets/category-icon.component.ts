import { Component, OnChanges, Input } from '@angular/core';
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
                private labels: Labels) {}


    ngOnChanges() {

        if (this.category === 'Configuration') {
            this.setValuesForConfigurationCategory();
        } else if (this.category === 'InventoryRegister') {
            this.setValuesForInventoryRegisterCategory();
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

        const category: CategoryForm|undefined = this.getCategory();

        this.character = category
            ? StringUtils.first(this.labels.get(category))
            : '?';
    }


    private determineColorForCategory() {

        this.color = this.getCategory()?.color ?? 'black';
    }


    private getCategory(): CategoryForm|undefined {

        if (!isString(this.category)) return this.category as CategoryForm;

        return this.customProjectConfiguration
            ? this.customProjectConfiguration.getCategory(this.category)
            : this.projectConfiguration.getCategory(this.category);
    }


    private setValuesForConfigurationCategory() {

        const categoryLabel: string = $localize `:@@navbar.tabs.configuration:Projektkonfiguration`;
        this.character = categoryLabel[0];
        this.color = 'black';
        this.textColor = 'white';
    }


    private setValuesForInventoryRegisterCategory() {

        const categoryLabel: string = $localize `:@@util.inventoryRegister:Inventarverzeichnis`;
        this.character = categoryLabel[0];
        this.color = 'black';
        this.textColor = 'white';
    }
}
