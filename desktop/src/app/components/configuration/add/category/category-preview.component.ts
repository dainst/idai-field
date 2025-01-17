import { Component, Input, OnChanges } from '@angular/core';
import { CategoryForm, Labels } from 'idai-field-core';


@Component({
    selector: 'category-preview',
    templateUrl: './category-preview.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CategoryPreviewComponent implements OnChanges {

    @Input() category: CategoryForm|undefined;

    public label: string;
    public description: string;


    constructor(private labels: Labels) {}


    public getLabel = (value: any) => this.labels.get(value);


    ngOnChanges() {

        if (!this.category) return;

        const { label, description } = this.labels.getLabelAndDescription(this.category);
        this.label = label;
        this.description = description;
    }
}
