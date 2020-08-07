import {Injectable} from '@angular/core';
import {Map} from 'tsfun';
import {ProjectConfiguration} from '../project-configuration';
import {ConfigurationValidation} from './configuration-validation';
import {ConfigReader} from './config-reader';
import {RelationDefinition} from '../model/relation-definition';
import {FieldDefinition} from '../model/field-definition';
import {buildRawProjectConfiguration} from './build-raw-project-configuration';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {addKeyAsProp} from '../../util/transformers';


@Injectable()
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

    public go(configDirPath: string, commonFields: { [fieldName: string]: any },
              builtinCategories: Map<BuiltinCategoryDefinition>, relations: Array<RelationDefinition>,
              extraFields: {[fieldName: string]: FieldDefinition },
              customConfigurationName: string|undefined,
              languages: string[]): ProjectConfiguration {

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
            languages);
    }


    private readLibraryCategories(configDirPath: string): any {

        const appConfigurationPath = configDirPath + '/Library/Categories.json';

        try {
            return addKeyAsProp('libraryId')(this.configReader.read(appConfigurationPath));
        } catch (msgWithParams) {
            throw [msgWithParams];
        }
    }


    private preprocess(configDirPath: string,
                       libraryCategories: Map<LibraryCategoryDefinition>,
                       commonFields: any,
                       builtinCategories: Map<BuiltinCategoryDefinition>,
                       relations: Array<RelationDefinition>,
                       extraFields: { [fieldName: string]: FieldDefinition },
                       customConfigurationName: string|undefined,
                       languages: string[]): ProjectConfiguration {

        const orderConfigurationPath = configDirPath + '/Order.json';
        const searchConfigurationPath = configDirPath + '/Search.json';
        const valuelistsConfigurationPath = configDirPath + '/Library/Valuelists.json';
        const customConfigPath = configDirPath
            + '/Config-' + (customConfigurationName ? customConfigurationName : 'Default') + '.json';

        let customCategories;
        let languageCoreConfigurations: any[];
        let languageConfigurations: any[];
        let customLanguageConfigurations: any[];
        let searchConfiguration: any;
        let valuelistsConfiguration: any;
        let orderConfiguration: any;

        try {
            languageCoreConfigurations = this.readLanguageConfigurations(
                configDirPath + '/Core/Language.',
                languages
            );
            languageConfigurations = this.readLanguageConfigurations(
                configDirPath + '/Library/Language.',
                languages
            );
            customLanguageConfigurations = this.readLanguageConfigurations(
                configDirPath + '/Language-' + (customConfigurationName
                    ? customConfigurationName
                    : 'Custom')
                + '.',
                languages
            );

            customCategories = this.configReader.read(customConfigPath);
            searchConfiguration = this.configReader.read(searchConfigurationPath);
            valuelistsConfiguration = this.configReader.read(valuelistsConfigurationPath);
            orderConfiguration = this.configReader.read(orderConfigurationPath);

            //console.log('languageCoreConfigurations', languageCoreConfigurations);
            //console.log('languageConfigurations', languageConfigurations);
            //console.log('customLanguageConfigurations', customLanguageConfigurations);
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
                    languageCoreConfigurations[0],
                    languageConfigurations[0],
                    customLanguageConfigurations[0],
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


    private readLanguageConfigurations(basePath: string, languages: string[]): any[] {

        const configurations: any[] = [];

        for (const language of languages) {
            const path: string = basePath + language + '.json';
            if (!this.configReader.exists(path)) continue;
            configurations.push(this.configReader.read(path));
        }

        return configurations;
    }
}
