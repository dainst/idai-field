import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Map, values} from 'tsfun';
import {ProjectConfiguration} from '../project-configuration';
import {ConfigurationValidation} from './configuration-validation';
import {ConfigReader} from './config-reader';
import {RelationDefinition} from '../model/relation-definition';
import {FieldDefinition} from '../model/field-definition';
import {buildRawProjectConfiguration} from './build-raw-project-configuration';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import { addKeyAsProp } from '../../util/utils';


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

    private defaultFields = {
        id: {
            editable: false,
            visible: false
        } as FieldDefinition,
        category: {
            label: this.i18n({ id: 'configuration.defaultFields.category', value: 'Kategorie' }),
            visible: false,
            editable: false
        } as FieldDefinition
    };


    constructor(private configReader: ConfigReader,
                private i18n: I18n) {}


    public async go(configDirPath: string, commonFields: { [fieldName: string]: any },
                    builtinCategories: Map<BuiltinCategoryDefinition>, relations: Array<RelationDefinition>,
                    extraFields: {[fieldName: string]: FieldDefinition },
                    customConfigurationName: string|undefined,
                    locale: string): Promise<ProjectConfiguration> {

        if (customConfigurationName) console.log('Load custom configuration', customConfigurationName);

        const libraryCategories: Map<LibraryCategoryDefinition> = await this.readLibraryCategories(configDirPath);

        const missingRelationCategoryErrors = ConfigurationValidation.findMissingRelationType(
            relations, Object.keys(builtinCategories as any)
        );
        if (missingRelationCategoryErrors.length > 0) throw missingRelationCategoryErrors;

        return await this.preprocess(
            configDirPath,
            libraryCategories,
            commonFields,
            builtinCategories,
            relations,
            extraFields,
            customConfigurationName,
            locale);
    }


    private async readLibraryCategories(configDirPath: string): Promise<any> {

        const appConfigurationPath = configDirPath + '/Library/Categories.json';

        try {
            return addKeyAsProp('libraryId')(await this.configReader.read(appConfigurationPath));
        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async preprocess(configDirPath: string,
                             libraryCategories: Map<LibraryCategoryDefinition>,
                             commonFields: any,
                             builtinCategories: Map<BuiltinCategoryDefinition>,
                             relations: Array<RelationDefinition>,
                             extraFields: { [fieldName: string]: FieldDefinition },
                             customConfigurationName: string|undefined,
                             locale: string): Promise<ProjectConfiguration> {

        const languageConfigurationPath = configDirPath + '/Library/Language.' + locale + '.json';
        const orderConfigurationPath = configDirPath + '/Order.json';
        const searchConfigurationPath = configDirPath + '/Search.json';
        const valuelistsConfigurationPath = configDirPath + '/Library/Valuelists.json';
        const customConfigPath = configDirPath
            + '/Config-' + (customConfigurationName ? customConfigurationName : 'Default') + '.json';

        let customCategories;
        let languageConfiguration: any;
        let customLanguageConfiguration: any;
        let searchConfiguration: any;
        let valuelistsConfiguration: any;
        let orderConfiguration: any;

        try {
            customCategories = await this.configReader.read(customConfigPath);
            languageConfiguration = await this.configReader.read(languageConfigurationPath);
            customLanguageConfiguration = await this.configReader.read(configDirPath + '/Language-'
                + (customConfigurationName
                    ? customConfigurationName
                    : 'Custom')
                + '.' + locale + '.json');
            searchConfiguration = await this.configReader.read(searchConfigurationPath);
            valuelistsConfiguration = await this.configReader.read(valuelistsConfigurationPath);
            orderConfiguration = await this.configReader.read(orderConfigurationPath);
        } catch (msgWithParams) {
            throw [[msgWithParams]];
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
                    {...this.defaultFields, ...extraFields},
                    relations,
                    languageConfiguration,
                    customLanguageConfiguration,
                    searchConfiguration,
                    orderConfiguration,
                    (categories: any) => {
                        const fieldValidationErrors = ConfigurationValidation.validateFieldDefinitions(values(categories));
                        if (fieldValidationErrors.length > 0) throw fieldValidationErrors;
                        return categories;
                    }));

        } catch (msgWithParams) {
            throw [msgWithParams];
        }
    }
}