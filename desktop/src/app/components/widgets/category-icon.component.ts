import {Component, OnChanges, Input} from '@angular/core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';


@Component({
  selector: 'category-icon',
  template: '<div class="category-icon" [style.width]="pxSize" [style.height]="pxSize" [style.font-size]="pxSize" [style.line-height]="pxSize" [style.background-color]="color">' +
    '<span class="character" [style.color]="textColor">{{character}}</span>' +
  '</div>'
})

/**
 * @author Sebastian Cuy
 */
export class CategoryIconComponent implements OnChanges {

    @Input() size: number;
    @Input() category: string;

    public character: string;
    public color: string;
    public textColor: string;
    public pxSize: string;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        this.character = this.projectConfiguration.getLabelForCategory(this.category).substr(0, 1);
        this.color = this.projectConfiguration.getColorForCategory(this.category);
        this.textColor = CategoryIconComponent.isColorTooBright(this.color) ? 'black' : 'white';
        this.pxSize = this.size + 'px';
    }


    private static isColorTooBright(c: any): boolean {

        c = c.substring(1);      // strip #
        let rgb = parseInt(c, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
        return luma > 200;
    }
}