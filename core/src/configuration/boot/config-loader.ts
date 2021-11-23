import { clone, Map } from 'tsfun';
import { PouchdbDatastore } from '../../datastore';
import { ConfigurationDocument } from '../../model/configuration-document';
import { Relation } from '../../model/configuration/relation';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { CustomFormDefinition } from '../model/form/custom-form-definition';
import { ProjectConfiguration } from '../../services/project-configuration';
import { buildRawProjectConfiguration } from './build-raw-project-configuration';
import { ConfigReader } from './config-reader';
import { ConfigurationValidation } from './configuration-validation';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { Valuelist } from '../../model/configuration/valuelist';


const DEFAULT_LANGUAGES = ['de', 'en', 'es', 'fr', 'it'];

type CustomConfiguration = {
    forms: Map<CustomFormDefinition>,
    order: string[]
};


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

    constructor(private configReader: ConfigReader,
                private pouchdbDatastore: PouchdbDatastore) {}


    public async go(commonFields: Map<BuiltInFieldDefinition>,
                    builtInCategories: Map<BuiltInCategoryDefinition>,
                    relations: Array<Relation>,
                    builtInFields: Map<BuiltInFieldDefinition>,
                    username: string,
                    customConfigurationName?: string|undefined,
                    customConfigurationDocument?: ConfigurationDocument): Promise<ProjectConfiguration> {

        if (customConfigurationName) console.log('Load custom configuration', customConfigurationName);

        const libraryCategories: Map<LibraryCategoryDefinition> = this.readLibraryFile('Categories.json');
        const libraryForms: Map<LibraryFormDefinition> = this.readLibraryFile('Forms.json');
        const libraryValuelists: Map<Valuelist> = this.readLibraryFile('Valuelists.json');

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
            username,
            customConfigurationName,
            customConfigurationDocument
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
                                    username: string,
                                    customConfigurationName?: string|undefined,
                                    customConfigurationDocument?: ConfigurationDocument): Promise<ProjectConfiguration> {

        let customForms;
        let languageConfigurations: LanguageConfigurations;
        let categoriesOrder: string[];
        let customValuelists: Map<Valuelist>;

        try {
            const configurationDocument = customConfigurationDocument ?? (await this.loadCustomConfiguration(
                customConfigurationName ?? 'Default',
                username
            ));
            customForms = configurationDocument.resource.forms;
            const defaultLanguageConfigurations = this.readDefaultLanguageConfigurations();
            languageConfigurations = {
                complete: this.getCompleteLanguageConfigurations(
                    defaultLanguageConfigurations, configurationDocument.resource.languages
                ),
                default: defaultLanguageConfigurations
            };
            categoriesOrder = configurationDocument.resource.order;
            customValuelists = configurationDocument.resource.valuelists;
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
                    categoriesOrder,
                    (categories: any) => {
                        const fieldValidationErrors =
                            ConfigurationValidation.validateFieldDefinitions(Object.values(categories));
                        if (fieldValidationErrors.length > 0) throw fieldValidationErrors;
                        return categories;
                    }));

        } catch (msgWithParams) {
            throw msgWithParams;
        }
    }


    private async loadCustomConfiguration(customConfigurationName: string, username: string): Promise<ConfigurationDocument> {

        let customConfiguration: ConfigurationDocument;
        try {
            customConfiguration = await this.pouchdbDatastore.getDb().get('configuration') as ConfigurationDocument;
        } catch (_) {
            return await this.storeCustomConfigurationInDatabase(customConfigurationName, username);
        }

        if (!customConfiguration.resource.forms || !customConfiguration.resource.languages
                || !customConfiguration.resource.order || !customConfiguration.resource.valuelists) {
            return await this.storeCustomConfigurationInDatabase(
                customConfigurationName, username, customConfiguration._rev
            );
        } else {
            return customConfiguration;
        }
    }


    private async storeCustomConfigurationInDatabase(customConfigurationName: string, username: string,
                                                     rev?: string): Promise<ConfigurationDocument> {
        
        const customConfiguration = await this.configReader.read('/Config-' + customConfigurationName + '.json');
        const languageConfigurations = this.configReader.getCustomLanguageConfigurations(customConfigurationName);
        const configuration: ConfigurationDocument
            = ConfigLoader.createConfigurationDocument(customConfiguration, languageConfigurations, username, rev);
        try {
            await this.pouchdbDatastore.getDb().put(configuration);
            return configuration;
        } catch (err) {
            // TODO Throw msgWithParams
            console.error('Failed to create configuration document!', err);
            throw ['Failed to create configuration document!'];
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


    private readLanguageConfiguration(path: string): LanguageConfiguration|undefined {

        if (!this.configReader.exists(path)) return undefined;
        return this.configReader.read(path);
    }


    private getCompleteLanguageConfigurations(defaultLanguageConfigurations: { [language: string]: Array<LanguageConfiguration> },
                                              customLanguageConfiguration: { [language: string]: LanguageConfiguration })
            : { [language: string]: Array<LanguageConfiguration> } {

        return Object.keys(customLanguageConfiguration).reduce((result, language) => {
            if (!result[language]) result[language] = [];
            result[language].unshift(customLanguageConfiguration[language]);
            return result;
        }, clone(defaultLanguageConfigurations));
    }


    private static createConfigurationDocument(customConfiguration: CustomConfiguration,
                                               languageConfigurations: { [language: string]: LanguageConfiguration },
                                               username: string, rev?: string): ConfigurationDocument {

        const configurationDocument = {
            _id: 'configuration',
            created: {
                user: username,
                date: new Date()
            },
            modified: [],
            resource: {
                id: 'configuration',
                identifier: 'Configuration',
                category: 'Configuration',
                relations: {},
                forms: customConfiguration.forms,
                order: customConfiguration.order,
                languages: languageConfigurations,
                valuelists: {}
            }
        };

        if (rev) configurationDocument['_rev'] = rev;

        return configurationDocument;
    }
}
