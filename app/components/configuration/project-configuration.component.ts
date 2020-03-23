import {Component} from '@angular/core';
import {to, on, is, includedIn, or} from 'tsfun';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {Category} from '../../core/configuration/model/category';
import {FieldDefinition} from '../../core/configuration/model/field-definition';
import {Group} from '../../core/configuration/model/group';
import {ValuelistUtil} from '../../core/util/valuelist-util';


@Component({
    moduleId: module.id,
    templateUrl: './project-configuration.html'
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public OVERRIDE_VISIBLE_FIELDS = ['identifier', 'shortDescription'];

    public categoriesTreeList: Array<Category>;
    public selectedCategory: Category;
    public selectedGroup: string;

    constructor(public projectConfiguration: ProjectConfiguration) {

        this.categoriesTreeList = projectConfiguration.getCategoriesList()
            .filter(category => !category.parentCategory);
        this.selectCategory(this.categoriesTreeList[0]);
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
        this.selectedGroup = this.getGroups(category)[0];
    }


    public getGroups = (category: Category): any[] => category.groups.map(to(Group.NAME));


    public getVisibleFields(category: Category): FieldDefinition[] {

        return category.groups
            .find(on(Group.NAME, is(this.selectedGroup)))!
            .fields
            .filter(
                or(
                    on(FieldDefinition.VISIBLE, is(true)),
                    on(FieldDefinition.NAME, includedIn(this.OVERRIDE_VISIBLE_FIELDS))
                )
            );
    }

    
    public getValueLabel = ValuelistUtil.getValueLabel;


    public getValuelistDescription = ValuelistUtil.getValuelistDescription;
}