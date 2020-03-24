import {Component} from '@angular/core';
import {to, on, is, includedIn, or} from 'tsfun';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {Category} from '../../core/configuration/model/category';
import {FieldDefinition} from '../../core/configuration/model/field-definition';
import {Group} from '../../core/configuration/model/group';
import {ValuelistDefinition} from '../../core/configuration/model/valuelist-definition';
import {ValuelistUtil} from '../../core/util/valuelist-util';
import {TabManager} from '../../core/tabs/tab-manager';

const locale: string = require('electron').remote.getGlobal('config').locale;


@Component({
    moduleId: module.id,
    templateUrl: './project-configuration.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public categoriesTreeList: Array<Category>;
    public selectedCategory: Category;
    public selectedGroup: string;

    private OVERRIDE_VISIBLE_FIELDS = ['identifier', 'shortDescription'];


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager) {

        this.categoriesTreeList = projectConfiguration.getCategoriesList()
            .filter(category => !category.parentCategory);
        this.selectCategory(this.categoriesTreeList[0]);
    }


    public getValueLabel = ValuelistUtil.getValueLabel;

    public getGroups = (category: Category): any[] => category.groups.map(to(Group.NAME));

    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getCategoryDescription = (category: Category) => category.description?.[locale];


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
        this.selectedGroup = this.getGroups(category)[0];
    }


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
}