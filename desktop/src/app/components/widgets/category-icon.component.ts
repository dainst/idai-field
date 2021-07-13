import { Component, OnChanges, Input } from '@angular/core';
import { isString } from 'tsfun';
import { Category, Labeled, ProjectConfiguration, StringUtils } from 'idai-field-core';

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
    @Input() category: string|Category;

    public character: Character;
    public color: Color;
    public textColor: Color;
    public pxSize: string;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        this.determineCharacterForCategory();
        this.determineColorForCategory();
        this.textColor = Category.isBrightColor(this.color)
            ? 'black'
            : 'white';
        this.pxSize = this.size + 'px';
    }


    private determineCharacterForCategory() {

        this.character =
            StringUtils.first(
                isString(this.category)
                    ? this.projectConfiguration.getLabelForCategory(this.category)
                    : Labeled.getLabel(this.category));
    }


    private determineColorForCategory() {

        this.color = isString(this.category)
            ? this.projectConfiguration.getColorForCategory(this.category)
            : this.category.color;
    }
}
