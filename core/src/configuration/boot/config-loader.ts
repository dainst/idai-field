import { isUndefinedOrEmpty, Map, map, not } from 'tsfun';
import { ProjectConfiguration } from '../project-configuration';
import { ConfigurationValidation } from './configuration-validation';
import { ConfigReader } from './config-reader';
import { buildRawProjectConfiguration } from './build-raw-project-configuration';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import { LibraryCategoryDefinition } from '../model/library-category-definition';
import { FieldDefinition } from '../../model/field-definition';
import { RelationDefinition } from '../../model/relation-definition';
import { addKeyAsProp } from '../../tools';
import { ValuelistDefinition } from '../../model/valuelist-definition';
import { PouchdbManager } from '../../datastore';
import { ConfigurationDocument } from '../../model/configuration-document';
import { CustomCategoryDefinition } from '../model';


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

    public async go(configDirPath: string, commonFields: { [fieldName: string]: any },
                    builtinCategories: Map<BuiltinCategoryDefinition>, relations: Array<RelationDefinition>,
                    extraFields: {[fieldName: string]: FieldDefinition },
                    customConfigurationName: string|undefined,
                    languages: string[], username: string): Promise<ProjectConfiguration> {

        if (customConfigurationName) console.log('Load custom configuration', customConfigurationName);

        const libraryCategories: Map<LibraryCategoryDefinition> = this.readLibraryCategories(configDirPath);

        const missingRelationCategoryErrors = ConfigurationValidation.findMissingRelationType(
            relations, Object.keys(builtinCategories as any)
        );
        if (missingRelationCategoryErrors.length > 0) throw missingRelationCategoryErrors;

        return this.preprocess(
            configDirPath,
            libraryCategories,
            commonFields,
            builtinCategories,
            relations,
            extraFields,
            customConfigurationName,
            languages,
            username);
    }


    private readLibraryCategories(configDirPath: string): any {

        const appConfigurationPath = configDirPath + '/Library/Categories.json';

        try {
            return addKeyAsProp('libraryId')(this.configReader.read(appConfigurationPath));
        } catch (msgWithParams) {
            throw [msgWithParams];
        }
    }


    private async preprocess(configDirPath: string,
                             libraryCategories: Map<LibraryCategoryDefinition>,
                             commonFields: any,
                             builtinCategories: Map<BuiltinCategoryDefinition>,
                             relations: Array<RelationDefinition>,
                             extraFields: { [fieldName: string]: FieldDefinition },
                             customConfigurationName: string|undefined,
                             languages: string[],
                             username: string): Promise<ProjectConfiguration> {

        const orderConfigurationPath = configDirPath + '/Order.json';
        const searchConfigurationPath = configDirPath + '/Search.json';
        const valuelistsConfigurationPath = configDirPath + '/Library/Valuelists.json';
        const customConfigPath = configDirPath
            + '/Config-' + (customConfigurationName ? customConfigurationName : 'Default') + '.json';

        let customCategories;
        let languageConfigurations: any[];
        let searchConfiguration: any;
        let valuelistsConfiguration: any;
        let orderConfiguration: any;

        try {
            languageConfigurations = this.readLanguageConfigurations(
                configDirPath, languages, customConfigurationName
            );
            customCategories = (await this.loadCustomConfiguration(customConfigPath, username)).resource.categories;
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


    private async loadCustomConfiguration(filePath: string, username: string): Promise<ConfigurationDocument> {

        try {
            return await this.pouchdbManager.getDb().get('configuration') as ConfigurationDocument;
        } catch (_) {
            return await this.storeCustomConfigurationInDatabase(filePath, username);
        }
    }


    private async storeCustomConfigurationInDatabase(filePath: string,
                                                     username: string): Promise<ConfigurationDocument> {

        const categories = await this.configReader.read(filePath);
        const configuration: ConfigurationDocument
            = ConfigLoader.createConfigurationDocument(categories, username);
        try {
            await this.pouchdbManager.getDb().put(configuration);
            return configuration;
        } catch (err) {
            // TODO Throw msgWithParams
            console.error('Failed to create configuration document!', err);
            throw ['Failed to create configuration document!'];
        }
    }


    private readLanguageConfigurations(configDirPath: string, languages: string[],
                                       customConfigurationName: string): any[] {

        const configurations = [];

        for (const language of languages) {
            configurations.push(
                this.readLanguageConfiguration(configDirPath + '/Language-' +
                    (customConfigurationName
                        ? customConfigurationName
                        : 'Custom')
                    + '.' + language + '.json')
            );
            configurations.push(
                this.readLanguageConfiguration(configDirPath + '/Library/Language.' + language + '.json')
            );
            configurations.push(
                this.readLanguageConfiguration(configDirPath + '/Core/Language.' + language + '.json')
            );
        }

        return configurations.filter(not(isUndefinedOrEmpty));
    }


    private readLanguageConfiguration(path: string): any|undefined {

        if (!this.configReader.exists(path)) return undefined;
        return this.configReader.read(path);
    }


    private readValuelistsConfiguration(path: string): Map<ValuelistDefinition> {

        const valuelistsConfiguration = this.configReader.read(path);
        map((definition: ValuelistDefinition, id: string) => definition.id = id, valuelistsConfiguration);

        return valuelistsConfiguration;
    }
    

    private static createConfigurationDocument(categories: { [formName: string]: CustomCategoryDefinition },
                                               username: string): ConfigurationDocument {

        return {
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
                categories: categories
            }
        };
    }
}
