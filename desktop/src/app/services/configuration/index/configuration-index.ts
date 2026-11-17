import { to, Map, clone } from 'tsfun';
import { BuiltInConfiguration, Category, CategoryForm, ConfigLoader, ConfigReader, ConfigurationDocument,
    createContextIndependentCategories, Field, Forest, getConfigurationName, LanguageConfiguration, Name,
    ProjectConfiguration, RawProjectConfiguration, Relation, Template, Tree, Valuelist } from 'idai-field-core';
import { CategoryFormIndex } from './category-form-index';
import { FieldIndex } from './field-index';
import { ValuelistIndex } from './valuelist-index';
import { ValuelistUsage, ValuelistUsageIndex } from './valuelist-usage-index';
import { CategoryFormChildrenIndex } from './category-form-children-index';
import { GroupEntry, GroupIndex } from './group-index';


/**
 * @author Thomas Kleinke
 */
export class ConfigurationIndex {

    private categoryFormIndex: CategoryFormIndex;
    private categoryFormChildrenIndex: CategoryFormChildrenIndex;
    private fieldIndex: FieldIndex;
    private valuelistIndex: ValuelistIndex;
    private valuelistUsageIndex: ValuelistUsageIndex;
    private groupIndex: GroupIndex;
    private valuelists: Map<Valuelist>;
    private templates: Map<Template>;


    constructor(private configReader: ConfigReader,
                private configLoader: ConfigLoader,
                private projectConfiguration: ProjectConfiguration,
                private projectIdentifier: string) {}

    
    public getTemplates = (): Map<Template> => this.templates;


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
    

    public findGroups(searchTerm: string): Array<GroupEntry> {

        return GroupIndex.find(this.groupIndex, searchTerm);
    }


    public getValuelist(valuelistId: string): Valuelist {

        return this.valuelists[valuelistId];
    }


    public getValuelistUsage(valuelistId: string): Array<ValuelistUsage>|undefined {

        return ValuelistUsageIndex.get(this.valuelistUsageIndex, valuelistId);
    }


    public getCategoryFormChildren(parentName: string): Array<CategoryForm> {

        return CategoryFormChildrenIndex.getChildren(this.categoryFormChildrenIndex, parentName);
    }


    public async rebuild(configurationDocument: ConfigurationDocument,
                         customProjectConfiguration?: ProjectConfiguration) {

        try {
            await this.buildConfigurationIndex(configurationDocument, customProjectConfiguration);
        } catch(err) {
            console.error('Error while trying to rebuild configuration index', err);
        }
    }


    public createSubIndices(forms: Array<CategoryForm>, categories: Array<Category>, relations: Array<Relation>,
                            commonFields: Array<Field>, valuelists: Array<Valuelist>,
                            usedCategoryForms: Array<CategoryForm>) {

        this.categoryFormIndex = CategoryFormIndex.create(forms);
        this.categoryFormChildrenIndex = CategoryFormChildrenIndex.create(forms);
        this.fieldIndex = FieldIndex.create(categories, relations, commonFields);
        this.valuelistIndex = ValuelistIndex.create(valuelists);
        this.valuelistUsageIndex = ValuelistUsageIndex.create(valuelists, usedCategoryForms);
        this.groupIndex = GroupIndex.create(usedCategoryForms);
    }


    private async buildConfigurationIndex(configurationDocument: ConfigurationDocument,
                                          customProjectConfiguration?: ProjectConfiguration) {

        const builtInConfiguration = new BuiltInConfiguration(getConfigurationName(this.projectIdentifier));
        const libraryCategories = await this.configReader.read('/Library/Categories.json');
        const libraryForms = await this.configReader.read('/Library/Forms.json');
        const valuelists = this.configLoader.readValuelists();
        const defaultLanguages = this.configLoader.readDefaultLanguageConfigurations();
        const customLanguages = this.getCustomLanguageConfigurations(configurationDocument);
        const languages = this.configLoader.mergeLanguageConfigurations(defaultLanguages, customLanguages);
        const usedCategoryForms = customProjectConfiguration
            ? customProjectConfiguration.getCategories()
            : this.projectConfiguration.getCategories();

        const rawConfiguration: RawProjectConfiguration = createContextIndependentCategories(
            builtInConfiguration.builtInCategories,
            libraryCategories,
            builtInConfiguration.builtInRelations,
            libraryForms,
            builtInConfiguration.commonFields,
            builtInConfiguration.builtInFields,
            valuelists,
            configurationDocument.resource.valuelists,
            this.getTopLevelCategoriesLibraryIds(usedCategoryForms),
            languages
        );

        this.valuelists = rawConfiguration.valuelists;
        this.templates = this.configLoader.readTemplates();

        this.createSubIndices(
            Tree.flatten(rawConfiguration.forms),
            Object.values(rawConfiguration.categories),
            customProjectConfiguration
                ? customProjectConfiguration.getRelations()
                : this.projectConfiguration.getRelations(),
            Object.values(rawConfiguration.commonFields),
            Object.values(rawConfiguration.valuelists),
            Tree.flatten(usedCategoryForms)
        );
    }


    private getCustomLanguageConfigurations(configurationDocument: ConfigurationDocument)
            : { [language: string]: LanguageConfiguration } {

        const languages = clone(configurationDocument.resource.languages);
        Object.keys(languages).forEach(language => {
            delete languages[language].categories;
            delete languages[language].groups;
            delete languages[language].relations;
        })

        return languages;
    }


    private getTopLevelCategoriesLibraryIds(usedCategoryForms: Forest<CategoryForm>): string[] {

        return Tree.flatten(usedCategoryForms)
            .filter(category => !category.parentCategory)
            .map(to('libraryId'));
    }
}
