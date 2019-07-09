import {IdaiType, Document, Resource} from 'idai-components-2';
import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow, map} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    const toResource = (resource: Resource) => { return { resource: resource } as Document; };

    const insertTypeName = (type: IdaiType) => (resource: Resource) => { resource.type = type.name; return resource; };


    export const getParse = (type: IdaiType, operationId: string): Parser =>
            (content: string) => {

                const documents = flow<any>(content,
                    makeLines,
                    CsvRowsConversion.parse(SEP, operationId),
                    map(insertTypeName(type)), // TODO make assoc function
                    map(toResource)
                    // TODO convert numbers and booleans
                );

                return Promise.resolve(documents);
            }
}