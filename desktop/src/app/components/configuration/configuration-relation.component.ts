import { Component, Input, OnChanges } from '@angular/core';
import { flatten, to } from 'tsfun';
import { Category, RelationDefinition } from 'idai-field-core';


@Component({
    selector: 'configuration-relation',
    templateUrl: './configuration-relation.html'
})
/**
* @author Sebastian Cuy 
* @author Thomas Kleinke
 */
export class ConfigurationRelationComponent implements OnChanges {

    @Input() category: Category;
    @Input() relation: RelationDefinition;

    public parentRelation: boolean = false;


    constructor() {}


    ngOnChanges() {

        this.parentRelation = this.isParentRelation();
    }


    private isParentRelation(): boolean {

        if (!this.category.parentCategory) return false;

        return flatten(this.category.parentCategory.groups.map(to('relations')))
            .map(to('name'))
            .includes(this.relation.name);
    }
}
