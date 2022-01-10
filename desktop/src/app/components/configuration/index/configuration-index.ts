import { Injectable } from '@angular/core';
import { to } from 'tsfun';
import { BuiltInConfiguration, Category, CategoryForm, ConfigLoader, ConfigReader, ConfigurationDocument,
    createContextIndependentCategories, Field, Name, ProjectConfiguration, RawProjectConfiguration,
    Tree, Valuelist } from 'idai-field-core';
import { CategoryFormIndex } from './category-form-index';
import { FieldIndex } from './field-index';
import { ValuelistIndex } from './valuelist-index';
import { ValuelistUsage, ValuelistUsageIndex } from './valuelist-usage-index';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class ConfigurationIndex {

    private categoryFormIndex: CategoryFormIndex;
    private fieldIndex: FieldIndex;
    private valuelistIndex: ValuelistIndex;
    private valuelistUsageIndex: ValuelistUsageIndex;


    constructor(private configReader: ConfigReader,
                private configLoader: ConfigLoader,
                private projectConfiguration: ProjectConfiguration) {}


    public findCategoryForms(searchTerm: string, parentCategory?: Name,
                             onlySupercategories?: boolean): Array<CategoryForm> {

        return CategoryFormIndex.find(this.categoryFormIndex, searchTerm, parentCategory, onlySupercategories);
    }


    public findFields(searchTerm: string, categoryName: string): Array<Field> {

        return FieldIndex.find(this.fieldIndex, searchTerm, categoryName);
    }


    public findValuelists(searchTerm: string): Array<Valuelist> {

        return ValuelistIndex.find(this.valuelistIndex, searchTerm);
    }


    public getValuelistUsage(valuelistId: string): Array<ValuelistUsage>|undefined {

        return ValuelistUsageIndex.get(this.valuelistUsageIndex, valuelistId);
    }


    public async rebuild(configurationDocument: ConfigurationDocument) {

        try {
            await this.buildConfigurationIndex(configurationDocument);
        } catch(err) {
            console.error('Error while trying to rebuild configuration index', err);
        }
    }


    private async buildConfigurationIndex(configurationDocument: ConfigurationDocument) {

        const builtInConfiguration = new BuiltInConfiguration('');
        const libraryCategories = await this.configReader.read('/Library/Categories.json');
        const libraryForms = await this.configReader.read('/Library/Forms.json');
        const valuelists = await this.configReader.read('/Library/Valuelists.json');
        const languages = await this.configLoader.readDefaultLanguageConfigurations();

        const rawConfiguration: RawProjectConfiguration = createContextIndependentCategories(
            builtInConfiguration.builtInCategories,
            libraryCategories,
            builtInConfiguration.builtInRelations,
            libraryForms,
            builtInConfiguration.commonFields,
            builtInConfiguration.builtInFields,
            valuelists,
            configurationDocument.resource.valuelists,
            this.getTopLevelCategoriesLibraryIds(),
            languages
        );

        this.createSubIndices(
            Tree.flatten(rawConfiguration.forms),
            Object.values(rawConfiguration.categories),
            Object.values(rawConfiguration.commonFields),
            Object.values(rawConfiguration.valuelists),
            Tree.flatten(this.projectConfiguration.getCategories())
        );
    }


    private createSubIndices(forms: Array<CategoryForm>, categories: Array<Category>,
                             commonFields: Array<Field>, valuelists: Array<Valuelist>,
                             usedCategories: Array<CategoryForm>) {

        this.categoryFormIndex = CategoryFormIndex.create(forms),
        this.fieldIndex = FieldIndex.create(categories, commonFields),
        this.valuelistIndex = ValuelistIndex.create(valuelists),
        this.valuelistUsageIndex = ValuelistUsageIndex.create(valuelists, usedCategories)
    }


    private getTopLevelCategoriesLibraryIds(): string[] {

        return Tree.flatten(this.projectConfiguration.getCategories())
            .filter(category => !category.parentCategory)
            .map(to('libraryId'));
    }
}
