import { flatMap, flow, filter, isEmpty, map, forEach, not, flatten, isString } from 'tsfun';
import { Document } from '../model/document';
import { Resource } from '../model/resource';
import { ResultSets } from './result-sets';
import { StringUtils } from '../tools/string-utils';
import { I18N } from '../tools';
import { Field, Valuelist, ValuelistValue } from '../model';


export interface FulltextIndex {

    [category: string]: {
        [term: string]: { [id: string]: true }
    }
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module FulltextIndex {

    const tokenizationPattern: RegExp = /[ \-_.]/;


    export function put(index: FulltextIndex,
                        document: Document,
                        fieldsToIndex: Array<Field>,
                        skipRemoval: boolean = false) {

        if (!skipRemoval) remove(index, document);

        const category: string = getCategory(document);

        if (!index[category]) index[category] = { '*' : {} } ;
        index[category]['*'][document.resource.id] = true;

        flow(
            fieldsToIndex,
            filter((field: Field) => document.resource[field.name] && document.resource[field.name] !== ''),
            flatMap((field: Field) => getTokens(document.resource[field.name], field)),
            map(StringUtils.toLowerCase),
            map(StringUtils.toArray),
            forEach(indexToken(index, document))
        );
    }


    export function remove(index: FulltextIndex, document: Document) {

        Object.keys(index).forEach(category =>
            Object.keys(index[category]).forEach(term => {
                delete index[category][term][document.resource.id];
            })
        );
    }


    /**
     * @param index
     * @param s search string, which gets tokenized, so that the result will include
     *   search hits for any of the tokens. If s is "hello world", all items which are
     *   indexed under either "hello" or "world" will be included in the result. The
     *   result will be a set in the sense that it will include each item only once.
     * @param categories if undefined, searches in all categories. If defined, only search hits
     *   indexed under the specified categories will be included in the results.
     */
    export function get(index: FulltextIndex,
                        s: string,
                        categories: string[]|undefined): Array<Resource.Id> {

        if (isEmpty(index)) return [];

        const resultSets = s
            .split(tokenizationPattern)
            .filter(not(isEmpty))
            .reduce(getFromIndex(index, categories), ResultSets.make());

        return ResultSets.collapse(resultSets) as Array<Resource.Id>;
    }


    function getFromIndex(index: FulltextIndex, categories: string[]|undefined) {

        return (resultSets: ResultSets<Resource.Id>, token: string) => {
            const ids = getForToken(
                index,
                token,
                categories
                    ? categories
                    : Object.keys(index)
            );
            ResultSets.combine(resultSets, ids);
            return resultSets;
        }
    }


    function indexToken(index: FulltextIndex, document: Document) {

        return (tokenAsCharArray: string[]) => {

            const categoryIndex = index[getCategory(document)];

            tokenAsCharArray.reduce((accumulator, letter) => {
                accumulator += letter;
                if (!categoryIndex[accumulator]) categoryIndex[accumulator] = {};
                categoryIndex[accumulator][document.resource.id] = true;
                return accumulator;
            }, '');
        }
    }


    function extractReplacementTokens(s: string) {

        const positionOpen = s.indexOf('[');
        const positionClose = s.indexOf(']');
        return positionOpen !== -1 && positionClose !== -1 && positionOpen < positionClose ?
            { hasPlaceholder: true, tokens: s.substr(positionOpen+1, positionClose-positionOpen-1)} :
            { hasPlaceholder: false, tokens: ''};
    }


    function getForToken(index: FulltextIndex, token: string, categories: string[]): Array<any> {

        const s = token.toLowerCase();

        function get(resultSets: ResultSets<Resource.Id>, category: string): ResultSets<Resource.Id> {

            const {hasPlaceholder, tokens} = extractReplacementTokens(s);
            return hasPlaceholder
                ? getWithPlaceholder(index, resultSets, s, category, tokens)
                : addKeyToResultSets(index, resultSets, category, s);
        }

        return ResultSets.unifyAddSets(categories.reduce(get, ResultSets.make()));
    }


    function getWithPlaceholder(index: FulltextIndex,
                                resultSets: ResultSets<Resource.Id>,
                                s: string,
                                category: string,
                                tokens: string): ResultSets<Resource.Id> {

        return tokens.split('').reduce((_resultSets, nextChar: string) =>
                addKeyToResultSets(
                    index, _resultSets, category, s.replace('[' + tokens + ']', nextChar)
                )
            , resultSets);
    }


    function addKeyToResultSets(index: FulltextIndex,
                                resultSets: ResultSets<Resource.Id>,
                                category: string,
                                s: string): ResultSets<Resource.Id> {

        if (!index[category] || !index[category][s]) return resultSets;

        ResultSets.combine(resultSets, Object.keys(index[category][s]));
        return resultSets;
    }


    function getTokens(value: string|I18N.String, field: Field): string[] {

        return isString(value)
            ? field.valuelist
                ? getTokensFromValuelist(value, field.valuelist)
                : getTokensFromString(value)
            : getTokensFromI18nString(value);
    }


    function getTokensFromValuelist(valueId: string, valuelist: Valuelist): string[] {

        const value: ValuelistValue = valuelist.values[valueId];

        return value
            ? value.label && !isEmpty(value.label)
                ? getTokensFromI18nString(value.label)
                : getTokensFromString(valueId)
            : [];
    }


    function getTokensFromString(stringValue: string) {

        return StringUtils.split(tokenizationPattern)(stringValue);
    }


    function getTokensFromI18nString(i18nString: I18N.String): string[] {

        return flatten(Object.values(i18nString).map(text => StringUtils.split(tokenizationPattern)(text)));
    }


    function getCategory(document: Document): string {

        return document.warnings?.unconfiguredCategory
            ? 'UNCONFIGURED'
            : document.resource.category;
    }
}
