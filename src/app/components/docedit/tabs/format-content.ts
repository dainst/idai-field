import { Dating, Dimension, OptionalRange } from 'idai-components-2';
import { Map, conds, flow, identity, isArray, otherwise } from 'tsfun';

export type InnerHTML = string;


export interface Translations {

    'before': string;
    'after': string;
}


/**
 * @author Daniel de Oliveira
 */
export function formatContent(fieldContent: any, translations: Translations): InnerHTML {

    return !isArray(fieldContent) 
        ? JSON.stringify(fieldContent)
        : flow(fieldContent, 
            convertArray(translations), 
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


const convertArray = (translations: Translations) => (fieldContent: Array<any>): Array<string> => {

    const getTranslation = (s: string) => translations[s];

    return fieldContent.map(conds(
            [Dating.isDating,
             element => Dating.generateLabel(element, getTranslation)],
            [Dimension.isDimension,
             element => Dimension.generateLabel(element, identity, getTranslation)],
            [OptionalRange.isOptionalRange,
             element => OptionalRange.generateLabel(element, getTranslation, getTranslation /* TODO */)],
            [otherwise,
             JSON.stringify]));
}
