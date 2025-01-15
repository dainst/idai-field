import { clone, Map } from 'tsfun';
import { ConfigurationDocument } from '../../model/document/configuration-document';
import { Relation } from '../../model/configuration/relation';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { ProjectConfiguration } from '../../services/project-configuration';
import { buildRawProjectConfiguration } from './build-raw-project-configuration';
import { ConfigReader } from './config-reader';
import { ConfigurationValidation } from './configuration-validation';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { Valuelist } from '../../model/configuration/valuelist';
import { Template } from '../../model/configuration/template';


const DEFAULT_LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'pt', 'tr', 'uk'];


/**
 * Lets clients subscribe for the app
 * configuration. In order for this to work, they
 * have to call <code>validateFieldDefinitions_</code> and <code>getProjectConfiguration</code>
 *  (the call order does not matter).
 *
 * It is recommended to handle a promise rejection of
 * <code>getProjectConfiguration</code> at a single place in your app.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Fabian Z.
 */
export class ConfigLoader {

    constructor(private configReader: ConfigReader) {}


    public async go(commonFields: Map<BuiltInFieldDefinition>,
                    builtInCategories: Map<BuiltInCategoryDefinition>,
                    relations: Array<Relation>,
                    builtInFields: Map<BuiltInFieldDefinition>,
                    configurationDocument: ConfigurationDocument,
                    includeAllRelations: boolean = false): Promise<ProjectConfiguration> {

        const libraryCategories: Map<LibraryCategoryDefinition> = this.readLibraryFile('Categories.json');
        const libraryForms: Map<LibraryFormDefinition> = this.readLibraryFile('Forms.json');
        const libraryValuelists: Map<Valuelist> = this.readValuelists();

        const missingRelationCategoryErrors = ConfigurationValidation.findMissingRelationType(
            relations, Object.keys(builtInCategories as any)
        );
        if (missingRelationCategoryErrors.length > 0) throw missingRelationCategoryErrors;

        return this.loadConfiguration(
            builtInCategories,
            libraryCategories,
            libraryForms,
            libraryValuelists,
            commonFields,
            relations,
            builtInFields,
            configurationDocument,
            includeAllRelations
        );
    }


    private readLibraryFile(fileName: string): any {

        try {
            return this.configReader.read('/Library/' + fileName);
        } catch (msgWithParams) {
            throw [msgWithParams];
        }
    }


    private async loadConfiguration(builtInCategories: Map<BuiltInCategoryDefinition>,
                                    libraryCategories: Map<LibraryCategoryDefinition>,
                                    libraryForms: Map<LibraryFormDefinition>,
                                    libraryValuelists: Map<Valuelist>,
                                    commonFields: Map<BuiltInFieldDefinition>,
                                    relations: Array<Relation>,
                                    builtInFields: Map<BuiltInFieldDefinition>,
                                    configurationDocument: ConfigurationDocument,
                                    includeAllRelations: boolean): Promise<ProjectConfiguration> {

        let customForms;
        let languageConfigurations: LanguageConfigurations;
        let projectLanguages: string[];
        let categoriesOrder: string[];
        let customValuelists: Map<Valuelist>;

        try {
            customForms = configurationDocument.resource.forms;
            const defaultLanguageConfigurations = this.readDefaultLanguageConfigurations();
            languageConfigurations = {
                complete: this.mergeLanguageConfigurations(
                    defaultLanguageConfigurations, configurationDocument.resource.languages
                ),
                custom: this.mergeLanguageConfigurations({}, configurationDocument.resource.languages),
                default: defaultLanguageConfigurations
            };
            categoriesOrder = configurationDocument.resource.order;
            customValuelists = configurationDocument.resource.valuelists;
            projectLanguages = configurationDocument.resource.projectLanguages;
        } catch (msgWithParams) {
            throw [msgWithParams];
        }

        try {
            return new ProjectConfiguration(
                buildRawProjectConfiguration(
                    builtInCategories,
                    libraryCategories,
                    libraryForms,
                    customForms,
                    commonFields,
                    libraryValuelists,
                    customValuelists,
                    builtInFields,
                    relations,
                    languageConfigurations,
                    projectLanguages,
                    categoriesOrder,
                    (categories: any) => {
                        const fieldValidationErrors =
                            ConfigurationValidation.validateFieldDefinitions(Object.values(categories));
                        if (fieldValidationErrors.length > 0) throw fieldValidationErrors;
                        return categories;
                    },
                    undefined,
                    includeAllRelations
                )
            );
        } catch (msgWithParams) {
            throw msgWithParams;
        }
    }


    public readDefaultLanguageConfigurations(): { [language: string]: Array<LanguageConfiguration> } {

        return DEFAULT_LANGUAGES.reduce((configurations, language) => {
            configurations[language] = [];
            configurations[language].push(
                this.readLanguageConfiguration('/Library/Language.' + language + '.json')
            );
            configurations[language].push(
                this.readLanguageConfiguration('/Core/Language.' + language + '.json')
            );
            return configurations;
        }, {});
    }


    public mergeLanguageConfigurations(defaultLanguageConfigurations: { [language: string]: Array<LanguageConfiguration> },
                                       customLanguageConfiguration: { [language: string]: LanguageConfiguration })
            : { [language: string]: Array<LanguageConfiguration> } {

        return Object.keys(customLanguageConfiguration).reduce((result, language) => {
            if (!result[language]) result[language] = [];
            result[language].unshift(customLanguageConfiguration[language]);
            return result;
        }, clone(defaultLanguageConfigurations));
    }


    public readTemplates(): Map<Template> {
     
        const templates: Map<Template> = this.configReader.read('/Library/Templates/Templates.json');
        Object.keys(templates).forEach(templateId => templates[templateId].name = templateId);

        return DEFAULT_LANGUAGES.reduce((result, language) => {
            const path: string = '/Library/Templates/Language.' + language + '.json';
            if (!this.configReader.exists(path)) return result;

            const labels = this.configReader.read(path);
            Object.values(result).forEach(template => {
                if (!template.label) template.label = {};
                template.label[language] = labels[template.name]?.label;
                if (labels[template.name]?.languageConfiguration) {
                    if (!template.configuration.languages) template.configuration.languages = {}
                    template.configuration.languages[language] = labels[template.name].languageConfiguration;
                }
            });

            return result;
        }, templates);
    }


    public readValuelists(): Map<Valuelist> {

        const valuelists: Map<Valuelist> = this.readLibraryFile('Valuelists/Valuelists.json');
        const languages = this.configReader.getValuelistsLanguages();
        this.setValuelistsLanguages(valuelists, languages);

        return valuelists;
    }


    private setValuelistsLanguages(valuelists: Map<Valuelist>, languages: any) {

        Object.keys(valuelists).forEach(valuelistId => {
            if (!valuelists[valuelistId].description) valuelists[valuelistId].description = {};
        });

        Object.keys(languages).forEach((section: 'default'|'project') => {
            Object.keys(languages[section]).forEach(language => {
                Object.keys(languages[section][language]).forEach(valuelistId => {
                    this.setValuelistDescription(valuelists, section, language, valuelistId, languages);
                    this.setValueLabels(valuelists, section, language, valuelistId, languages);
                });
            });
        })
    }


    private setValuelistDescription(valuelists: Map<Valuelist>, section: 'default'|'project', language: string,
                                    valuelistId: string, languages: any) {

        if (!languages[section][language][valuelistId].description) return;

        valuelists[valuelistId].description[language]
            = languages[section][language][valuelistId].description;
    }


    private setValueLabels(valuelists: Map<Valuelist>, section: 'default'|'project', language: string,
                           valuelistId: string, languages: any) {

        if (!languages[section][language][valuelistId].values) return; 

        Object.keys(languages[section][language][valuelistId].values)
            .filter(valueId => languages[section][language][valuelistId].values[valueId]?.length)
            .forEach(valueId => {
                if (!valuelists[valuelistId].values[valueId].label) {
                    valuelists[valuelistId].values[valueId].label = {};
                }
                valuelists[valuelistId].values[valueId].label[language]
                    = languages[section][language][valuelistId].values[valueId];
            });
    }


    private readLanguageConfiguration(path: string): LanguageConfiguration|undefined {

        if (!this.configReader.exists(path)) return undefined;
        return this.configReader.read(path);
    }
}
