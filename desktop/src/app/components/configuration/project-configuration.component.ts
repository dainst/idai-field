import { Component } from '@angular/core';
import { to, on, is, isnt, or, any, compose, map, Predicate, includedIn, and, not, flatten } from 'tsfun';
import { FieldResource, Named, Category, Group, RelationDefinition, FieldDefinition, Datastore,
    ConfigurationDocument, Relations, ProjectConfiguration, CustomCategoryDefinition } from 'idai-field-core';
import { TabManager } from '../../core/tabs/tab-manager';
import { MenuContext, MenuService } from '../menu-service';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { MessagesConversion } from '../docedit/messages-conversion';
import { reload } from '../../core/common/reload';

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
 * @author Thomas Kleinke
 */
export class ProjectConfigurationComponent {

    public toplevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public selectedGroup: string;
    public customConfigurationDocument: ConfigurationDocument;
    public saving: boolean = false;
    public showHiddenFields: boolean = true;
    public permanentlyHiddenFields: { [categoryName: string]: string[] };

    private OVERRIDE_VISIBLE_FIELDS = [FieldResource.IDENTIFIER, FieldResource.SHORTDESCRIPTION];


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private menuService: MenuService,
                private datastore: Datastore,
                private messages: Messages,
                private settingsProvider: SettingsProvider) {

        this.toplevelCategoriesArray = projectConfiguration.getCategoriesArray()
            .filter(category => !category.parentCategory);
        this.selectCategory(this.toplevelCategoriesArray[0]);
        this.datastore.get('configuration').then(document => {
            this.customConfigurationDocument = document as ConfigurationDocument;
            this.permanentlyHiddenFields = this.getPermanentlyHiddenFields(projectConfiguration.getCategoriesArray());
        });
    }


    public getCategoryDescription = (category: Category) => category.description?.[locale];


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async save() {

        try {
            await this.datastore.update(
                this.customConfigurationDocument,
                this.settingsProvider.getSettings().username
            );
            reload();
        } catch (errWithParams) {
            this.messages.add(MessagesConversion.convertMessage(errWithParams, this.projectConfiguration));
        }
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
        this.selectedGroup = this.getGroups(category)[0].name;
    }


    public getGroups(category: Category): Array<Group> {

        return category.groups.filter(
            or(
                (_: Group) => _.fields.length > 0,
                (_: Group) => _.relations.length > 0
            )
        );
    }


    public getFields(category: Category): Array<FieldDefinition> {

        return category.groups
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .fields
            .filter(
                and(
                    on(FieldDefinition.NAME, not(includedIn(this.permanentlyHiddenFields[category.name]))),
                    or(
                        () => this.showHiddenFields,
                        not(this.isHidden(category))
                    )
                )
            );
    }


    public isHidden = (category: Category) => (field: FieldDefinition): boolean => {

        const customCategoryDefinition: CustomCategoryDefinition
            = this.customConfigurationDocument.resource.categories[category.libraryId];

        const parentCustomCategoryDefinition = category.parentCategory
            ? this.customConfigurationDocument.resource.categories[category.parentCategory.libraryId]
            : undefined;

        return (customCategoryDefinition.hidden ?? []).includes(field.name) || 
            (parentCustomCategoryDefinition?.hidden ?? []).includes(field.name);
    }


    public toggleHidden(category: Category, field: FieldDefinition) {

        const customCategoryDefinition: CustomCategoryDefinition
            = this.customConfigurationDocument.resource.categories[category.libraryId];
        
        if (this.isHidden(category)(field)) {
            customCategoryDefinition.hidden
                = customCategoryDefinition.hidden.filter(name => name !== field.name);
        } else {
            if (!customCategoryDefinition.hidden) customCategoryDefinition.hidden = [];
            customCategoryDefinition.hidden.push(field.name);
        }
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


    private getPermanentlyHiddenFields(categories: Array<Category>): { [categoryName: string]: string[] } {

        return categories.reduce((result, category) => {
            result[category.name] = flatten(category.groups.map(to('fields')))
                .filter(field => !field.visible
                    && !this.OVERRIDE_VISIBLE_FIELDS.includes(field.name)
                    && (!category.libraryId || !this.isHidden(category)(field)))
                .map(to('name'));
            return result;
        }, {})
    }
}
