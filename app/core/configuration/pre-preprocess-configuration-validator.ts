import {intersection, subtract} from 'tsfun';
import {RelationDefinition} from './model/relation-definition';

/**
 * TODO can we get rid of this?
 *
 * Used to validate to configuration in the form it comes from the user, i.e.
 * as Configuration.json. This means before the preprocess step has been executed,
 * where additional hardcoded definitions from app configurators may come in.
 *
 * @author Daniel de Oliveira
 */
export class PrePreprocessConfigurationValidator {


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