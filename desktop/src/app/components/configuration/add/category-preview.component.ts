import { Component, Input } from '@angular/core';
import { Category, Labels } from 'idai-field-core';


@Component({
    selector: 'category-preview',
    templateUrl: './category-preview.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CategoryPreviewComponent {

    @Input() category: Category|undefined;


    constructor(private labels: Labels) {}


    public getLabel = (value: any) => this.labels.get(value);
}
