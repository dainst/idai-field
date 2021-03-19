import { Dating, Dimension, Literature, OptionalRange } from 'idai-components-2';
import { conds, flow, identity, isArray, isString, otherwise } from 'tsfun';

export type InnerHTML = string;


/**
 * Right now, there is no translation of field entries. // TODO needed?
 * 
 * @author Daniel de Oliveira
 */
export function formatContent(fieldContent: any): InnerHTML {

    return !isArray(fieldContent) 
        ? JSON.stringify(fieldContent) /* TODO review possible object types */
        : flow(fieldContent, 
            convertArray, 
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


const convertArray = (fieldContent: Array<any>): Array<string> =>
    fieldContent.map(conds(
        [Dating.isDating,
            element => Dating.generateLabel(element, identity)],
        [Dimension.isDimension,
            element => Dimension.generateLabel(element, identity, identity)],
        [OptionalRange.buildIsOptionalRange(isString),
            element => OptionalRange.generateLabel(element, identity, identity as any /* TODO, review getLabel */)],
        [Literature.isLiterature,
            element => Literature.generateLabel(element, identity /*, TODO zenonId? */)],
        [otherwise,
            JSON.stringify]));
