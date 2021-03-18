import { Dating, Dimension, Literature, OptionalRange } from 'idai-components-2';
import { Map, conds, flow, identity, isArray, otherwise } from 'tsfun';

export type InnerHTML = string;


export type Translations 
    = Literature.Translations
    |Dating.Translations
    |Dimension.Translations;


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

    const getTranslations = (s: string) => translations[s]; // TODO remove

    return fieldContent.map(conds(
            [Dating.isDating,
             element => Dating.generateLabel(element, translations as Dating.Translations)],
            [Dimension.isDimension,
             element => Dimension.generateLabel(element, identity, translations as Dimension.Translations)],
            [OptionalRange.isOptionalRange,
             element => OptionalRange.generateLabel(element, getTranslations, identity /* TODO */)],
            [Literature.isLiterature,
             element => Literature.generateLabel(element, translations as Literature.Translations /* TODO zenonId? */)],
            [otherwise,
             JSON.stringify]));
}
