import { Map, map, set } from 'tsfun';
import { PouchdbManager } from '../../datastore';
import { ConfigurationDocument } from '../../model/configuration-document';
import { FieldDefinition } from '../../model/field-definition';
import { RelationDefinition } from '../../model/relation-definition';
import { ValuelistDefinition } from '../../model/valuelist-definition';
import { addKeyAsProp } from '../../tools';
import { CustomCategoryDefinition } from '../model';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import { LanguageConfiguration } from '../model/language-configuration';
import { LibraryCategoryDefinition } from '../model/library-category-definition';
import { ProjectConfiguration } from '../project-configuration';
import { buildRawProjectConfiguration } from './build-raw-project-configuration';
import { ConfigReader } from './config-reader';
import { ConfigurationValidation } from './configuration-validation';


const BUILT_IN_LANGUAGES = ['de', 'en', 'es', 'it'];


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
                private pouchdbManager: PouchdbManager) {}


    public async go(commonFields: { [fieldName: string]: any },
                    builtinCategories: Map<BuiltinCategoryDefinition>, relations: Array<RelationDefinition>,
                    extraFields: {[fieldName: string]: FieldDefinition },
                    customConfigurationName: string|undefined,
                    username: string): Promise<ProjectConfiguration> {

        if (customConfigurationName) console.log('Load custom configuration', customConfigurationName);

        const libraryCategories: Map<LibraryCategoryDefinition> = this.readLibraryCategories();

        const missingRelationCategoryErrors = ConfigurationValidation.findMissingRelationType(
            relations, Object.keys(builtinCategories as any)
        );
        if (missingRelationCategoryErrors.length > 0) throw missingRelationCategoryErrors;

        return this.loadConfiguration(
            libraryCategories,
            commonFields,
            builtinCategories,
            relations,
            extraFields,
            customConfigurationName,
            username);
    }


    private readLibraryCategories(): any {

        const appConfigurationPath = '/Library/Categories.json';

        try {
            return addKeyAsProp('libraryId')(this.configReader.read(appConfigurationPath));
        } catch (msgWithParams) {
            throw [msgWithParams];
        }
    }


    private async loadConfiguration(libraryCategories: Map<LibraryCategoryDefinition>,
                                    commonFields: any,
                                    builtinCategories: Map<BuiltinCategoryDefinition>,
                                    relations: Array<RelationDefinition>,
                                    extraFields: { [fieldName: string]: FieldDefinition },
                                    customConfigurationName: string|undefined,
                                    username: string): Promise<ProjectConfiguration> {

        const orderConfigurationPath = '/Order.json';
        const searchConfigurationPath = '/Search.json';
        const valuelistsConfigurationPath = '/Library/Valuelists.json';

        let customCategories;
        let languageConfigurations: { [language: string]: Array<LanguageConfiguration> };
        let searchConfiguration: any;
        let valuelistsConfiguration: any;
        let orderConfiguration: any;

        try {
            const configurationDocument = (await this.loadCustomConfiguration(
                customConfigurationName ?? 'Default',
                username
            ));
            customCategories = configurationDocument.resource.categories;
            languageConfigurations = this.readLanguageConfigurations(configurationDocument.resource.languages);
            searchConfiguration = this.configReader.read(searchConfigurationPath);
            valuelistsConfiguration = this.readValuelistsConfiguration(valuelistsConfigurationPath);
            orderConfiguration = this.configReader.read(orderConfigurationPath);
        } catch (msgWithParams) {
            throw [msgWithParams];
        }

        // unused: Preprocessing.prepareSameMainCategoryResource(appConfiguration);
        // unused: Preprocessing.setIsRecordedInVisibilities(appConfiguration); See #8992

        try {
            return new ProjectConfiguration(
                buildRawProjectConfiguration(
                    builtinCategories,
                    libraryCategories,
                    customCategories,
                    commonFields,
                    valuelistsConfiguration,
                    extraFields,
                    relations,
                    languageConfigurations,
                    searchConfiguration,
                    orderConfiguration,
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
            customConfiguration = await this.pouchdbManager.getDb().get('configuration') as ConfigurationDocument;
        } catch (_) {
            return await this.storeCustomConfigurationInDatabase(customConfigurationName, username);
        }

        if (!customConfiguration.resource.categories || !customConfiguration.resource.languages) {
            return await this.storeCustomConfigurationInDatabase(
                customConfigurationName, username, customConfiguration._rev
            );
        } else {
            return customConfiguration;
        }
    }


    private async storeCustomConfigurationInDatabase(customConfigurationName: string, username: string,
                                                     rev?: string): Promise<ConfigurationDocument> {
        const categories = await this.configReader.read('/Config-' + customConfigurationName + '.json');
        const languageConfigurations = this.configReader.getCustomLanguageConfigurations(customConfigurationName);
        const configuration: ConfigurationDocument
            = ConfigLoader.createConfigurationDocument(categories, languageConfigurations, username, rev);
        try {
            await this.pouchdbManager.getDb().put(configuration);
            return configuration;
        } catch (err) {
            // TODO Throw msgWithParams
            console.error('Failed to create configuration document!', err);
            throw ['Failed to create configuration document!'];
        }
    }


    public readLanguageConfigurations(customLanguageConfigurations: { [language: string]: LanguageConfiguration })
            : { [language: string]: Array<LanguageConfiguration> } {

        const languages: string[] = set(
            Object.keys(customLanguageConfigurations).concat(BUILT_IN_LANGUAGES)
        );

        return languages.reduce((configurations, language) => {
            configurations[language] = [];
            if (customLanguageConfigurations[language]) {
                configurations[language].push(customLanguageConfigurations[language]);
            }
            if (BUILT_IN_LANGUAGES.includes(language)) {
                configurations[language].push(
                    this.readLanguageConfiguration('/Library/Language.' + language + '.json')
                );
                configurations[language].push(
                    this.readLanguageConfiguration('/Core/Language.' + language + '.json')
                );
            }
            return configurations;
        }, {});
    }


    private readLanguageConfiguration(path: string): LanguageConfiguration|undefined {

        if (!this.configReader.exists(path)) return undefined;
        return this.configReader.read(path);
    }


    private readValuelistsConfiguration(path: string): Map<ValuelistDefinition> {

        const valuelistsConfiguration = this.configReader.read(path);
        map((definition: ValuelistDefinition, id: string) => definition.id = id, valuelistsConfiguration);

        return valuelistsConfiguration;
    }
    

    private static createConfigurationDocument(categories: { [formName: string]: CustomCategoryDefinition },
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
                categories: categories,
                languages: languageConfigurations
            }
        };

        if (rev) configurationDocument['_rev'] = rev;

        return configurationDocument;
    }
}
