import { Dating, Dimension, Literature, OptionalRange } from 'idai-components-2';
import { conds, flow, identity, isArray, isString, otherwise } from 'tsfun';

export type InnerHTML = string;


export type Translations 
    = Literature.Translations
    |Dating.Translations
    |Dimension.Translations
    |OptionalRange.Translations;


/**
 * @author Daniel de Oliveira
 */
export function formatContent(fieldContent: any, getTranslation: (term: Translations) => string): InnerHTML {

    return !isArray(fieldContent) 
        ? JSON.stringify(fieldContent) /* TODO review possible object types */
        : flow(fieldContent, 
            convertArray(getTranslation), 
            formatArray);
}


function formatArray(fieldContent: Array<string>): InnerHTML {

    let contentString: string = '<div>[';
    for (let element of fieldContent) {
        if (contentString.length > 6) contentString += ',';
        contentString += '<br>';
        contentString += '&nbsp;&nbsp;"' + element + '"';
    }
    return contentString += '</div>]';
}


const convertArray = (getTranslation: (term: Translations) => string) => (fieldContent: Array<any>): Array<string> =>
    fieldContent.map(conds(
        [Dating.isDating,
            element => Dating.generateLabel(element, getTranslation)],
        [Dimension.isDimension,
            element => Dimension.generateLabel(element, identity, getTranslation)],
        [OptionalRange.buildIsOptionalRange(isString),
            element => OptionalRange.generateLabel(element, getTranslation, identity as any /* TODO, review getLabel */)],
        [Literature.isLiterature,
            element => Literature.generateLabel(element, getTranslation /*, TODO zenonId? */)],
        [otherwise,
            JSON.stringify]));
