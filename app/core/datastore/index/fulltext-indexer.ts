import {flatMap, flow as _} from 'tsfun';
import {Document, FieldDefinition, ProjectConfiguration} from 'idai-components-2';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {clone} from '../../../util/object-util';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FulltextIndexer {

    private defaultFieldsToIndex = ['identifier', 'shortDescription'];

    private index: {
        [resourceType: string]: {
            [term: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };


    constructor(private projectConfiguration: ProjectConfiguration,
                private showWarnings = true) {

        this.setUp();
    }


    public clear = () => this.setUp();


    public put(document: Document, skipRemoval: boolean = false) {

        function indexToken(tokenAsCharArray: string[]) {

            const typeIndex = this.index[document.resource.type];

            tokenAsCharArray.reduce((accumulator, letter) => {
                accumulator += letter;
                if (!typeIndex[accumulator]) typeIndex[accumulator] = {};
                typeIndex[accumulator][document.resource.id as any] = indexItem;
                return accumulator;
            }, '');
        }


        const indexItem = IndexItem.from(document, this.showWarnings);
        if (!indexItem) return;

        if (!skipRemoval) this.remove(document);
        if (!this.index[document.resource.type]) this.index[document.resource.type] = {'*' : { } };
        this.index[document.resource.type]['*'][document.resource.id as any] = indexItem;

        _(this.getFieldsToIndex(document.resource.type)
            .filter(field => document.resource[field])
            .filter(field => document.resource[field] !== '')
            .map(field => document.resource[field]),
            flatMap((content: string) => content.split(' ')))
            .map(token => token.toLowerCase())
            .map(token => Array.from(token))
            .forEach(indexToken.bind(this));
    }


    public remove(doc: any) {

        Object.keys(this.index).forEach(type =>
            Object.keys(this.index[type])
                .filter(term => this.index[type][term][doc.resource.id])
                .forEach(term => delete this.index[type][term][doc.resource.id]))
    }


    /**
     * @param s search string, which gets tokenized, so that the result will include
     *   search hits for any of the tokens. If s is "hello world", all items which are
     *   indexed under either "hello" or "world" will be included in the result. The
     *   result will be a set in the sense that it will include each item only once.
     * @param types if undefined, searches in all types. If defined, only search hits
     *   indexed under the specified types will be included in the results.
     * @returns {any} array of items
     */
    public get(s: string, types: string[]|undefined): Array<IndexItem> {

        if (Object.keys(this.index).length == 0) return [];

        function getFromIndex(resultSets: ResultSets, token: string) {
            return resultSets.combine(
                    FulltextIndexer.getForToken(
                        this.index, token, types ? types : Object.keys(this.index))
            );
        }

        return s
            .split(' ')
            .filter(token => token.length > 0)
            .reduce(getFromIndex.bind(this), ResultSets.make())
            .collapse() as Array<IndexItem>;
    }


    private setUp() {

        this.index = {};
    }


    private getFieldsToIndex(typeName: string): string[] {

        return Object.values(this.projectConfiguration.getTypesMap()[typeName].fields)
            .filter((field: FieldDefinition) => field.fulltextIndexed)
            .map((field: FieldDefinition) => field.name)
            .concat(this.defaultFieldsToIndex);
    }


    private static extractReplacementTokens(s: string) {

        const positionOpen = s.indexOf('[');
        const positionClose = s.indexOf(']');
        return positionOpen !== -1 && positionClose !== -1 && positionOpen < positionClose ?
            {hasPlaceholder: true, tokens: s.substr(positionOpen+1, positionClose-positionOpen-1)} :
            {hasPlaceholder: false, tokens: ''};
    }


    private static getForToken(index: any, token: string, types: string[]): Array<any> {

        const s = token.toLowerCase();

        function get(resultSets: ResultSets, type: string): ResultSets {

            const {hasPlaceholder, tokens} = FulltextIndexer.extractReplacementTokens(s);
            return (hasPlaceholder)
                ? this.getWithPlaceholder(index, resultSets, s, type, tokens)
                : this.addKeyToResultSets(index, resultSets, type, s);
        }

        return types.reduce(get.bind(this), ResultSets.make()).unify();
    }


    private static getWithPlaceholder(index: any, resultSets: any, s: string, type: string, tokens: string): ResultSets {

        return tokens.split('').reduce((_resultSets, nextChar: string) =>
                FulltextIndexer.addKeyToResultSets(index,
                    _resultSets, type, s.replace('['+tokens+']',nextChar))
            , resultSets.copy());
    }


    private static addKeyToResultSets(index: any, resultSets: any, type: string, s: string): ResultSets {

        return (!index[type] || !index[type][s]) ?
            resultSets.copy() :
            resultSets.copy().combine(
                Object.keys(index[type][s]).map(id => clone(index[type][s][id])));
    }
}