import { Datastore, Document, IndexFacade, WarningType } from 'idai-field-core';
import { UtilTranslations } from '../../util/util-translations';


export type WarningFilter = {
    label: string;
    constraintName: string;
    count: number;
    type?: WarningType;
};


/**
 * @author Thomas Kleinke
 */
export module WarningFilters {

    export async function getWarningFilters(indexFacade: IndexFacade, translations: UtilTranslations,
                                            configurationConflict: boolean): Promise<Array<WarningFilter>> {

        const filters: Array<WarningFilter> = [
            {
                label: translations.getTranslation('warnings.all'),
                constraintName: 'warnings:exist',
                count: configurationConflict ? 1 : 0
            },
            {
                label: translations.getTranslation('warnings.conflicts'),
                constraintName: 'conflicts:exist',
                count: configurationConflict ? 1 : 0,
                type: 'conflicts'
            },
            {
                label: translations.getTranslation('warnings.unconfigured'),
                constraintName: 'unconfigured:exist',
                count: 0,
                type: 'unconfigured'
            },
            {
                label: translations.getTranslation('warnings.invalidFieldData'),
                constraintName: 'invalid:exist',
                count: 0,
                type: 'invalid'
            },
            {
                label: translations.getTranslation('warnings.outlierValues'),
                constraintName: 'outlierValues:exist',
                count: 0,
                type: 'outlierValues'
            },
            {
                label: translations.getTranslation('warnings.missingRelationTargets'),
                constraintName: 'missingRelationTargets:exist',
                count: 0,
                type: 'missingRelationTargets'
            },
            {
                label: translations.getTranslation('warnings.missingIdentifierPrefixes'),
                constraintName: 'missingIdentifierPrefix:exist',
                count: 0,
                type: 'missingIdentifierPrefix'
            },
            {
                label: translations.getTranslation('warnings.nonUniqueIdentifiers'),
                constraintName: 'nonUniqueIdentifier:exist',
                count: 0,
                type: 'nonUniqueIdentifier'
            },
            {
                label: translations.getTranslation('warnings.resourceLimitExceeded'),
                constraintName: 'resourceLimitExceeded:exist',
                count: 0,
                type: 'resourceLimitExceeded'
            }
        ];

        filters.forEach(filter => filter.count += indexFacade.getCount(filter.constraintName, 'KNOWN'));

        return filters.filter(filter => filter.count > 0);
    }


    export async function hasConfigurationConflict(datastore: Datastore): Promise<boolean> {

        try {
            const configurationDocument: Document = await datastore.get('configuration', { conflicts: true });
            return configurationDocument._conflicts !== undefined;
        } catch (_) {
            // No configuration document in database
            return false;
        }
    }
}
