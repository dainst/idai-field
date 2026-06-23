import { isArray, isObject, Map, set } from 'tsfun';
import { Document } from '../model/document/document';
import { BaseField, Field } from '../model/configuration/field';
import { Valuelist } from '../model/configuration/valuelist';
import { ValuelistUtil } from '../tools/valuelist-util';


export function getOutlierValues(fieldContainer: any, field: BaseField,
                                 projectDocument: Document): Map<string[]>|string[] {

    const fieldContent: any = fieldContainer[field.name];
    if (!fieldContent) return [];

    if (field.inputType === Field.InputType.COMPOSITE) {
        return getOutlierValuesForCompositeField(field, fieldContent, projectDocument);
    }

    const valuelist: Valuelist = ValuelistUtil.getValuelist(field, projectDocument, [], true);
    return valuelist
        ? set(ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, valuelist) ?? [])
        : [];
}


function getOutlierValuesForCompositeField(field: Field, fieldContent: any, projectDocument: Document): Map<string[]> {

    if (!isArray(fieldContent)) return {};

    let outliers: Map<string[]> = {};

    for (let entry of fieldContent) {
        if (!isObject(entry)) continue;

        for (let subfield of field.subfields) {
            if (!Field.InputType.VALUELIST_INPUT_TYPES.includes(subfield.inputType)) continue;

            const subfieldOutliers: string[] = getOutlierValues(entry, subfield, projectDocument) as string[];
            if (!subfieldOutliers.length) continue;

            if (outliers[subfield.name]) {
                outliers[subfield.name] = set(outliers[subfield.name].concat(subfieldOutliers));
            } else {
                outliers[subfield.name] = subfieldOutliers;
            }
        }
    }

    return outliers;
}
