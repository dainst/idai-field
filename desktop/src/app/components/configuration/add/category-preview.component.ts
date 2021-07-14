import { Component, Input } from '@angular/core';
import { Category, Labels } from 'idai-field-core';
import { keysValues } from 'tsfun';


@Component({
    selector: 'category-preview',
    templateUrl: './category-preview.html'
})
/**
 * @author Daniel de Oliveira
 */
export class CategoryPreviewComponent {

    @Input() category: Category|undefined;


    constructor(private labels: Labels) {}


    public getLabel = (value: any) => this.labels.get(value);

    public getLabels = (field: any /* TODO any*/) => keysValues(field);
}
