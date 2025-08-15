import { isArray, isNumber, isObject, isString } from 'tsfun';
import { Document } from '../model/document/document';
import { OptionalRange } from '../model/input-types/optional-range';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { ProjectConfiguration } from '../services';
import { DateSpecification } from '../model/input-types/date-specification';
import { Measurement } from '../model/input-types/measurement';


export const singleToMultipleValuesFieldNames: string[] = [
    'processor',
    'supervisor',
    'draughtsmen',
    'campaign',
    'archaeoDox:distinguishingCriterium'
];


/**
 * @author Thomas Kleinke
 */
export module Migrator {

    /**
     * @param document is modified in place
     * */
    export function migrate(document: Document, projectConfiguration: ProjectConfiguration) {

        migrateGeneralFieldsAndRelations(document);
        migratePeriodFields(document);
        migrateSingleToMultipleValues(document);
        migrateWeightFields(document);
        migrateDatings(document, projectConfiguration);
        migrateDates(document, projectConfiguration);
        migrateProjectValuelistFields(document);
    }


    function migratePeriodFields(document: Document) {

        const PERIOD = 'period';
        const PERIODEND = 'periodEnd';

        if (document.resource[PERIOD] && !isObject(document.resource[PERIOD])) {

            document.resource[PERIOD] = {
                value: document.resource[PERIOD]
            };
            if (document.resource[PERIODEND]) {
                document.resource[PERIOD][OptionalRange.ENDVALUE] = document.resource[PERIODEND];
                delete document.resource[PERIODEND];
            }
        }
    }


    function migrateGeneralFieldsAndRelations(document: Document) {

        if (document.resource.relations) delete document.resource.relations['includes'];

        if (document.resource.type) {
            document.resource.category = document.resource['type'];
            delete document.resource['type'];
        }
    }


    function migrateSingleToMultipleValues(document: Document) {

        singleToMultipleValuesFieldNames.forEach((fieldName: string) => {
           if (document.resource[fieldName] && !Array.isArray(document.resource[fieldName])) {
               document.resource[fieldName] = [document.resource[fieldName]];
           }
        });
    }


    function migrateWeightFields(document: Document) {

        if (document.resource.weight !== undefined && isNumber(document.resource.weight)) {
            const weight: Measurement = {
                inputValue: document.resource.weight,
                inputUnit: 'g',
                isImprecise: false
            };
            Measurement.addNormalizedValues(weight);
            document.resource.weight = [weight];
        }
    }


    function migrateDatings(document: Document, projectConfiguration: ProjectConfiguration) {

        const category: CategoryForm = projectConfiguration.getCategory(document);
        if (!category) return;

        CategoryForm.getFields(category)
            .filter(field => field.inputType === Field.InputType.DATING)
            .forEach(field => {
                const datings = document.resource[field.name];
                if (!datings || !isArray(datings)) return;
                datings.forEach(dating => {
                    if (dating.type === 'exact') dating.type = 'single';
                })
            });
    }


    function migrateProjectValuelistFields(document: Document) {

        if (document.resource.category !== 'Project') return;

        const fieldNames: string[] = ['staff', 'campaigns'];

        for (let fieldName of fieldNames) {
            const fieldData: any = document.resource[fieldName];
            if (isArray(fieldData) && fieldData.every(element => isString(element))) {
                document.resource[fieldName] = fieldData.map(value => {
                    return { value, selectable: true };
                });
            }
        }
    }


    function migrateDates(document: Document, projectConfiguration: ProjectConfiguration) {

        migrateBeginningAndEndDates(document);
        migrateDatesByInputType(document, projectConfiguration);
    }


    function migrateBeginningAndEndDates(document: Document) {

        const beginningDate: string = document.resource.beginningDate;
        const endDate: string = document.resource.endDate;

        if ((!beginningDate || !isString(beginningDate)) && (!endDate || !isString(endDate))) return;

        const date: DateSpecification = { isRange: true };
        if (beginningDate && isString(beginningDate)) date['value'] = beginningDate;
        if (endDate && isString(endDate)) date['endValue'] = endDate;
        document.resource.date = date;

        delete document.resource.beginningDate;
        delete document.resource.endDate;
    }


    function migrateDatesByInputType(document: Document, projectConfiguration: ProjectConfiguration) {

        const category: CategoryForm = projectConfiguration.getCategory(document);
        if (!category) return;

        CategoryForm.getFields(category)
            .filter(field => field.inputType === Field.InputType.DATE)
            .forEach(field => {
                const date: any = document.resource[field.name];
                if (date && isString(date)) document.resource[field.name] = { value: date, isRange: false };
            });
    }
}
