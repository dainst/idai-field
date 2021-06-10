import { Component, OnInit } from '@angular/core';
import { Category, Datastore, ConfigurationDocument, ProjectConfiguration, CustomCategoryDefinition } from 'idai-field-core';
import { TabManager } from '../../core/tabs/tab-manager';
import { MenuContext, MenuService } from '../menu-service';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { MessagesConversion } from '../docedit/messages-conversion';
import { reload } from '../../core/common/reload';


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
export class ProjectConfigurationComponent implements OnInit {

    public toplevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public customConfigurationDocument: ConfigurationDocument;
    public saving: boolean = false;
    public showHiddenFields: boolean = true;


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private menuService: MenuService,
                private datastore: Datastore,
                private messages: Messages,
                private settingsProvider: SettingsProvider) {

        this.toplevelCategoriesArray = projectConfiguration.getCategoriesArray()
            .filter(category => !category.parentCategory);
        this.selectCategory(this.toplevelCategoriesArray[0]);
    }


    async ngOnInit() {

        this.customConfigurationDocument = await this.datastore.get(
            'configuration',
            { skipCache: true }
        ) as ConfigurationDocument;
    }


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
    }


    public getCustomCategoryDefinition(category: Category): CustomCategoryDefinition|undefined {

        return this.customConfigurationDocument.resource.categories[category.libraryId ?? category.name];
    }

    
    public getParentCustomCategoryDefinition(category: Category): CustomCategoryDefinition|undefined {

        return category.parentCategory
            ? this.customConfigurationDocument.resource.categories[category.parentCategory.name]
            : undefined;
    }
}
