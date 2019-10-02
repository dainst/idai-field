import {intersection, subtract, isNot, includedIn} from 'tsfun';
import {RelationDefinition} from 'idai-components-2';

/**
 * Used to validate to configuration in the form it comes from the user, i.e.
 * as Configuration.json. This means before the preprocess step has been executed,
 * where additional hardcoded definitions from app configurators may come in.
 *
 * @author Daniel de Oliveira
 */
export class PrePreprocessConfigurationValidator {

    /**
     * Starting with 2.1.8 of idai-field we forbid visible and editable
     * to be configured by the user directly via Configuration.json.
     * Instead we offer to configure that separately wie Hidden.json.
     *
     * This is to reduce the necessity to have different configurations which have to be
     * tracked, when the only thing they differ in is the visitiliy/editability settings.
     */
    public go(appConfiguration: any): Array<Array<string>> {

        if (!appConfiguration.types) return [];

        return PrePreprocessConfigurationValidator.checkForForbiddenTopLevelFields(appConfiguration)
            .concat(PrePreprocessConfigurationValidator.checkForExtraneousFieldsInTypes(appConfiguration));
    }


    private static checkForForbiddenTopLevelFields(appConfiguration: any): Array<Array<string>> {

        const allowedFields = ['identifier', 'types'];

        const result = Object.keys(appConfiguration).find(isNot(includedIn(allowedFields)));

        return result
            ? [['relations cannot be defined via external configuration']]
            : [];
    }


    private static checkForExtraneousFieldsInTypes(appConfiguration: any): Array<Array<string>> {

        const allowedFields = ['inputType', 'name', 'valuelist', 'positionValues'];

        let errs: string[][] = [];
        for (let typeName of Object.keys(appConfiguration.types)) {
            const type = appConfiguration.types[typeName];

            if (type.fields) {
                for (let fieldName of Object.keys(type.fields)) {
                    const field = type.fields[fieldName];
                    const diff = subtract(allowedFields)(Object.keys(field));
                    if (diff.length > 0) errs.push(['field(s) not allowed:', diff] as never);
                }
            }
        }
        return errs;
    }


    private static evaluateRelationDomain(relation: RelationDefinition, appConfiguration: any) {

        if (intersection([relation.domain, this.imageTypes(appConfiguration)]).length > 0) {
            return (['image type/ isRecordedIn must not be defined manually', relation] as any);

        } else if (intersection([relation.domain, this.operationSubtypes(appConfiguration)]).length > 0) {
            return ['operation subtype as domain type/ isRecordedIn must not be defined manually', relation] as any;
        } else {

            if (subtract(this.operationSubtypes(appConfiguration))(relation.domain).length > 0) {
                for (let rangeType of relation.range) {
                    if (!this.operationSubtypes(appConfiguration).includes(rangeType)) {
                        return ['isRecordedIn - only operation subtypes allowed in range', relation] as any;
                    }
                }
            }
        }
    }


    private static operationSubtypes(appConfiguration: any) {

        return Object.keys(appConfiguration.types)
            .filter(typeName => appConfiguration.types[typeName].parent === 'Operation');
    }


    private static imageTypes(appConfiguration: any) {

        return Object.keys(appConfiguration.types)
            .filter(typeName => appConfiguration.types[typeName].parent === 'Image')
            .concat(['Image']);
    }
}