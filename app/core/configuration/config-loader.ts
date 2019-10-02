import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration} from 'idai-components-2';
import {Preprocessing} from 'idai-components-2';
import {ConfigReader} from 'idai-components-2';
import {TypeDefinition} from 'idai-components-2';
import {RelationDefinition} from 'idai-components-2';
import {FieldDefinition} from 'idai-components-2';
import {PrePreprocessConfigurationValidator} from './pre-preprocess-configuration-validator';
import {ConfigurationDefinition} from './configuration-definition';
import {UnorderedConfigurationDefinition} from './unordered-configuration-definition';
import {ConfigurationValidator} from './configuration-validator';

const nonExtendableTypes: string[] = ['Operation', 'Place'];


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


    public async go(configDirPath: string, commonFields: any,
                    extraTypes: {[typeName: string]: TypeDefinition }, relations: Array<RelationDefinition>,
                    extraFields: {[fieldName: string]: FieldDefinition },
                    prePreprocessConfigurationValidator: PrePreprocessConfigurationValidator,
                    postPreprocessConfigurationValidator: ConfigurationValidator,
                    customConfigurationName: string|undefined,
                    locale: string): Promise<ProjectConfiguration> {

        if (customConfigurationName) console.log('Load custom configuration', customConfigurationName);

        let appConfiguration: any = await this.readConfiguration(configDirPath);

        const prePreprocessValidationErrors = prePreprocessConfigurationValidator.go(appConfiguration);
        if (prePreprocessValidationErrors.length > 0) throw prePreprocessValidationErrors;

        appConfiguration = await this.preprocess(
            configDirPath, appConfiguration, commonFields, extraTypes, relations,
            extraFields, customConfigurationName, locale);

        const postPreprocessValidationErrors = postPreprocessConfigurationValidator.go(appConfiguration);
        if (postPreprocessValidationErrors.length > 0) throw postPreprocessValidationErrors;

        return new ProjectConfiguration(appConfiguration);
    }


    private async readConfiguration(configDirPath: string): Promise<any> {

        const appConfigurationPath = configDirPath + '/Fields.json';

        try {
            return { types: await this.configReader.read(appConfigurationPath) };
        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async preprocess(configDirPath: string, appConfiguration: any, commonFields: any,
                             extraTypes: {[typeName: string]: TypeDefinition },
                             relations: Array<RelationDefinition>,
                             extraFields: {[fieldName: string]: FieldDefinition },
                             customConfigurationName: string|undefined,
                             locale: string): Promise<ConfigurationDefinition> {

        const hiddenConfigurationPath = configDirPath + '/Hidden.json';
        const customHiddenConfigurationPath = configDirPath + '/Hidden-'
            + (customConfigurationName ? customConfigurationName : 'Custom') + '.json';
        const languageConfigurationPath = configDirPath + '/Language.' + locale + '.json';
        const orderConfigurationPath = configDirPath + '/Order.json';
        const searchConfigurationPath = configDirPath + '/Search.json';
        const periodConfigurationPath = configDirPath + '/Periods'
            + (customConfigurationName ? '-' + customConfigurationName : '') + '.json';

        Preprocessing.prepareSameMainTypeResource(appConfiguration);
        // TODO rename and test / also: it is idai field specific
        // Preprocessing.setIsRecordedInVisibilities(appConfiguration); See #8992

        // to be done before applyCustomFields so that extra types can get additional fields too
        Preprocessing.addExtraTypes(appConfiguration, extraTypes);

        const customConfigPath = configDirPath
            + '/Fields-' + (customConfigurationName ? customConfigurationName : 'Custom') + '.json';
        await this.applyCustomFieldsConfiguration(appConfiguration, customConfigPath);

        Preprocessing.replaceCommonFields(appConfiguration, commonFields);

        await this.applyHiddenConfs(appConfiguration, hiddenConfigurationPath, customHiddenConfigurationPath);

        appConfiguration.relations = [];
        Preprocessing.addExtraFields(appConfiguration, extraFields);
        Preprocessing.addExtraRelations(appConfiguration, relations);
        Preprocessing.addExtraFields(appConfiguration, this.defaultFields);

        await this.applyLanguageConfs(appConfiguration, languageConfigurationPath,
            configDirPath + '/Language-'
            + (customConfigurationName
            ? customConfigurationName
            : 'Custom')
            + '.' + locale + '.json'
        );

        await this.applySearchConfiguration(appConfiguration, searchConfigurationPath);
        await this.applyPeriodConfiguration(appConfiguration, periodConfigurationPath);

        return this.getOrderedConfiguration(appConfiguration, orderConfigurationPath);
    }


    private async applyCustomFieldsConfiguration(appConfiguration: any,
                                                 customFieldsConfigurationPath: string) {

        try {
            const customConfiguration = await this.configReader.read(customFieldsConfigurationPath);
            Preprocessing.applyCustom(appConfiguration, customConfiguration, nonExtendableTypes);

        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async applyLanguageConfs(appConfiguration: any, languageConfigurationPath: string,
                                     customLanguageConfigurationPath: string) {

        try {
            const languageConfiguration = await this.configReader.read(languageConfigurationPath);
            Preprocessing.applyLanguage(appConfiguration, languageConfiguration); // TODO test it
        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }

        try {
            const customLanguageConfiguration = await this.configReader.read(customLanguageConfigurationPath);
            Preprocessing.applyLanguage(appConfiguration, customLanguageConfiguration); // TODO test it
        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async applySearchConfiguration(appConfiguration: any, searchConfigurationPath: string) {

        try {
            const searchConfiguration = await this.configReader.read(searchConfigurationPath);
            Preprocessing.applySearchConfiguration(appConfiguration, searchConfiguration);
        }  catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async applyPeriodConfiguration(appConfiguration: any, periodConfigurationPath: string) {

        try {
            const datingConfiguration = await this.configReader.read(periodConfigurationPath);
            Preprocessing.applyPeriodConfiguration(appConfiguration, datingConfiguration);
        }  catch (msgWithParams) {
            throw [[msgWithParams]];
        }
    }


    private async applyHiddenConfs(appConfiguration: any, hiddenConfigurationPath: string,
                                   customHiddenConfigurationPath: string) {

        try {
            const hiddenConfiguration = await this.configReader.read(hiddenConfigurationPath);
            ConfigLoader.hideFields(appConfiguration, hiddenConfiguration);
        } catch (_) {}

        try {
            const customHiddenConfiguration = await this.configReader.read(customHiddenConfigurationPath);
            ConfigLoader.hideFields(appConfiguration, customHiddenConfiguration);
        } catch (_) {}
    }


    private async getOrderedConfiguration(appConfiguration: UnorderedConfigurationDefinition,
                                          orderConfigurationPath: string): Promise<ConfigurationDefinition> {

        let orderedConfiguration: ConfigurationDefinition;

        try {
            const orderConfiguration = await this.configReader.read(orderConfigurationPath);
            ConfigLoader.addExtraFieldsOrder(appConfiguration, orderConfiguration);

            orderedConfiguration = {
                identifier: appConfiguration.identifier,
                relations: appConfiguration.relations,
                types: ConfigLoader.getOrderedTypes(appConfiguration, orderConfiguration)
            };

        } catch (msgWithParams) {
            throw [[msgWithParams]];
        }

        return orderedConfiguration;
    }


    private static addExtraFieldsOrder(appConfiguration: UnorderedConfigurationDefinition, // TODO remove
                                       orderConfiguration: any) {

        if (!orderConfiguration.fields) orderConfiguration.fields = {};

        Object.keys(appConfiguration.types).forEach(typeName => {
            if (!orderConfiguration.fields[typeName]) orderConfiguration.fields[typeName] = [];
            orderConfiguration.fields[typeName]
                = [].concat(orderConfiguration.fields[typeName]);
        });
    }


    private static getOrderedTypes(appConfiguration: UnorderedConfigurationDefinition,
                                   orderConfiguration: any): Array<TypeDefinition> {

        const types: Array<TypeDefinition> = [];

        if (orderConfiguration.types) {
            orderConfiguration.types.forEach((typeName: string) => {
                const type: TypeDefinition | undefined = appConfiguration.types[typeName];
                if (type) this.addToOrderedTypes(type, typeName, types, orderConfiguration);
            });
        }

        Object.keys(appConfiguration.types).forEach(typeName => {
            if (!types.find(type => type.type === typeName)) {
                this.addToOrderedTypes(appConfiguration.types[typeName], typeName, types, orderConfiguration);
            }
        });

        return types;
    }


    private static addToOrderedTypes(type: TypeDefinition, typeName: string, types: Array<TypeDefinition>,
                                     orderConfiguration: any) {

        if (types.includes(type)) return;

        type.type = typeName;
        type.fields = this.getOrderedFields(type, orderConfiguration);
        types.push(type);
    }


    private static getOrderedFields(type: TypeDefinition, orderConfiguration: any): Array<FieldDefinition> {

        const fields: Array<FieldDefinition> = [];

        if (!type.fields) return fields;

        if (orderConfiguration.fields[type.type]) {
            orderConfiguration.fields[type.type].forEach((fieldName: string) => {
                const field: FieldDefinition | undefined = type.fields[fieldName];
                if (field) this.addToOrderedFields(field, fieldName, fields);
            });
        }

        Object.keys(type.fields).forEach(fieldName => {
            if (!fields.find(field => field.name === fieldName)) {
                this.addToOrderedFields(type.fields[fieldName], fieldName, fields);
            }
        });

        return fields;
    }


    private static addToOrderedFields(field: FieldDefinition, fieldName: string,
                                      fields: Array<FieldDefinition>) {

        if (fields.includes(field)) return;

        field.name = fieldName;
        fields.push(field);
    }


    private static hideFields(appConfiguration: any, hiddenConfiguration: any) {

        if (!appConfiguration.types) return;

        Object.keys(hiddenConfiguration).forEach(typeName => {
            const type: TypeDefinition|undefined = appConfiguration.types[typeName];
            if (!type || !type.fields) return;

            hiddenConfiguration[typeName].forEach((fieldName: string) => {
                const field: FieldDefinition|undefined = type.fields[fieldName];
                if (field) {
                    field.visible = false;
                    field.editable = false;
                }
            });
        });
    }
}