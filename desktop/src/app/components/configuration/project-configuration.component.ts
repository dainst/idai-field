import { Component, OnInit } from '@angular/core';
import { Category, Datastore, ConfigurationDocument, ProjectConfiguration,  } from 'idai-field-core';
import { TabManager } from '../../core/tabs/tab-manager';
import { MenuContext, MenuService } from '../menu-service';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { MessagesConversion } from '../docedit/messages-conversion';
import { ConfigurationChange } from '../../core/configuration/configuration-change';


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

    public topLevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public customConfigurationDocument: ConfigurationDocument;
    public saving: boolean = false;
    public showHiddenFields: boolean = true;


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private menuService: MenuService,
                private datastore: Datastore,
                private messages: Messages,
                private settingsProvider: SettingsProvider) {}


    async ngOnInit() {

        this.loadCategories();
        this.selectCategory(this.topLevelCategoriesArray[0]);

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


    public async saveChanges(configurationChange: ConfigurationChange) {

        try {
            this.customConfigurationDocument = await this.datastore.update(
                configurationChange.newCustomConfigurationDocument,
                this.settingsProvider.getSettings().username
            ) as ConfigurationDocument;
        } catch (errWithParams) {
            this.messages.add(MessagesConversion.convertMessage(errWithParams, this.projectConfiguration));
            return;
        }

        this.projectConfiguration.update(configurationChange.newProjectConfiguration);
        this.loadCategories();
        this.selectCategory(this.projectConfiguration.getCategory(this.selectedCategory.name));
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
    }


    private loadCategories() {

        this.topLevelCategoriesArray = this.projectConfiguration.getCategoriesArray()
            .filter(category => !category.parentCategory);
    }
}
