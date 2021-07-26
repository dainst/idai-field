import { Component, Input, OnChanges } from '@angular/core';
import { Category, Groups, Labels } from 'idai-field-core';


@Component({
    selector: 'category-preview',
    templateUrl: './category-preview.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CategoryPreviewComponent implements OnChanges {

    @Input() category: Category|undefined;

    public label: string;
    public description: string;


    constructor(private labels: Labels) {}


    public getLabel = (value: any) => this.labels.get(value);

    public getGroups = () => this.category.groups.filter(group => group.name !== Groups.HIDDEN_CORE_FIELDS);


    ngOnChanges() {

        const { label, description } = this.labels.getLabelAndDescription(this.category);
        this.label = label;
        this.description = description;
    }
}
