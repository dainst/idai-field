import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration} from './project-configuration';
import {Preprocessing} from './preprocessing';
import {ConfigurationValidator} from './configuration-validator';
import {ConfigReader} from './config-reader';
import {RelationDefinition} from './model/relation-definition';
import {FieldDefinition} from './model/field-definition';
import {ConfigurationDefinition} from './configuration-definition';
import {BuiltinTypeDefinitions} from "./model/builtin-type-definition";
import {LibraryTypeDefinitions} from "./model/library-type-definition";
import {mergeTypes} from "./merge-types";


@Injectable()
/**
 * Lets clients subscribe for the app
 * configuration. In order for this to work, they
 * have to call <code>go</code> and <code>getProjectConfiguration</code>
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
        'id': {
            editable: false,
            visible: false
        } as FieldDefinition,
        'type': {
            label: this.i18n({ id: 'configuration.defaultFields.type', value: 'Typ' }),
            visible: false,
            editable: false
        } as FieldDefinition
    };


    constructor(private configReader: ConfigReader,
                private i18n: I18n) {}


    public async go(configDirPath: string,
                    commonFields: {[fieldName: string]: any},
                    builtinTypes: BuiltinTypeDefinitions,
                    relations: Array<RelationDefinition>,
                    extraFields: {[fieldName: string]: FieldDefinition },
                    postPreprocessConfigurationValidator: ConfigurationValidator,
                    customConfigurationName: string|undefined,
                    locale: string): Promise<ProjectConfiguration> {

        if (customConfigurationName) console.log('Load custom configuration', customConfigurationName);

        const registeredTypes: LibraryTypeDefinitions = await this.readConfiguration(configDirPath);

        const appConfiguration = await this.preprocess(
            configDirPath, registeredTypes, commonFields, builtinTypes, relations,
            extraFields, customConfigurationName, locale);

        const postPreprocessValidationErrors = postPreprocessConfigurationValidator.go(appConfiguration);
        if (postPreprocessValidationErrors.length > 0) throw postPreprocessValidationErrors;

        return new ProjectConfiguration(appConfiguration);
    }


    private async readConfiguration(configDirPath: string): Promise<any> {

        const appConfigurationPath = configDirPath + '/Library/Types.json';

        try {
            return await this.configReader.read(appConfigurationPath);
        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async preprocess(configDirPath: string,
                             libraryTypes: LibraryTypeDefinitions,
                             commonFields: any,
                             builtinTypes: BuiltinTypeDefinitions,
                             relations: Array<RelationDefinition>,
                             extraFields: {[fieldName: string]: FieldDefinition },
                             customConfigurationName: string|undefined,
                             locale: string): Promise<ConfigurationDefinition> {

        const languageConfigurationPath = configDirPath + '/Library/Language.' + locale + '.json';
        const orderConfigurationPath = configDirPath + '/Order.json';
        const searchConfigurationPath = configDirPath + '/Search.json';
        const valuelistsConfigurationPath = configDirPath + '/Library/Valuelists.json';
        const customConfigPath = configDirPath
            + '/Config-' + (customConfigurationName ? customConfigurationName : 'Default') + '.json';

        let customTypes;
        let languageConfiguration: any;
        let customLanguageConfiguration: any;
        let searchConfiguration: any;
        let valuelistsConfiguration: any;
        let orderConfiguration: any;

        try {
            customTypes = await this.configReader.read(customConfigPath);
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


        // unused: Preprocessing.prepareSameMainTypeResource(appConfiguration);
        // unused: Preprocessing.setIsRecordedInVisibilities(appConfiguration); See #8992

        let typeDefs: any;
        try {
            typeDefs = mergeTypes(
                builtinTypes,
                libraryTypes,
                customTypes,
                commonFields,
                valuelistsConfiguration,
                {...this.defaultFields, ...extraFields});
        } catch (msgWithParams) {
            throw [msgWithParams];
        }

        try {
            return Preprocessing.preprocess2(
                { types: typeDefs },
                languageConfiguration,
                customLanguageConfiguration,
                searchConfiguration,
                orderConfiguration,
                relations);

        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }
}