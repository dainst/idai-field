import {Component} from '@angular/core';
import {to, on, is, isnt, includedIn, or, any, compose, map, Predicate} from 'tsfun';
import {FieldResource, Named, Category, Group, RelationDefinition, FieldDefinition} from 'idai-field-core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ValuelistUtil} from '../../core/util/valuelist-util';
import {TabManager} from '../../core/tabs/tab-manager';
import {Relations, ValuelistDefinition} from 'idai-field-core';
import {MenuContext, MenuService} from '../menu-service';

const locale: string = typeof window !== 'undefined'
  ? window.require('@electron/remote').getGlobal('config').locale
  : 'de';


@Component({
    templateUrl: './project-configuration.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public toplevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public selectedGroup: string;

    private OVERRIDE_VISIBLE_FIELDS = [FieldResource.IDENTIFIER, FieldResource.SHORTDESCRIPTION];


    constructor(projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private menuService: MenuService) {

        this.toplevelCategoriesArray = projectConfiguration.getCategoriesArray()
            .filter(category => !category.parentCategory);
        this.selectCategory(this.toplevelCategoriesArray[0]);
    }


    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getCategoryDescription = (category: Category) => category.description?.[locale];


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
        this.selectedGroup = this.getGroups(category)[0].name;
    }


    public getGroups(category: Category): Array<Group> {

        return category.groups.filter(
            or(
                (group: Group) => this.getVisibleFields(this.selectedCategory, group.name).length > 0,
                (group: Group) => group.relations.length > 0
            )
        );
    }


    public getVisibleFields(category: Category, groupName: string): Array<FieldDefinition> {

        return category.groups
            .find(on(Named.NAME, is(groupName)))!
            .fields
            .filter(
                or(
                    on(FieldDefinition.VISIBLE, is(true)),
                    on(FieldDefinition.NAME, includedIn(this.OVERRIDE_VISIBLE_FIELDS))
                )
            );
    }


    public getRelations(category: Category): Array<RelationDefinition> {

        return category.groups
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .relations
            .filter(on(Named.NAME, isnt(Relations.Type.INSTANCEOF)));
    }


    public hasCustomFields: Predicate<Group> = compose(
        to<Array<FieldDefinition>>(Group.FIELDS),
        map(_ => _.source),
        any(is(FieldDefinition.Source.CUSTOM))
    );
}
