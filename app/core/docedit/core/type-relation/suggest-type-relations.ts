import {separate, Pair, to, is, first} from 'tsfun';
import {asyncMap} from 'tsfun-extra';
import {FieldDocument, Query} from 'idai-components-2';
import {Name} from '../../../constants';
import {FieldDocumentFindResult} from '../../../datastore/field/field-read-datastore';

type Row = Pair<FieldDocument, Array<FieldDocument>>;

/**
 * Suggests and ranks types.
 *
 * Ranks according to a simple heuristic.
 * It puts the rows to the top, which have a majority
 * of their connected finds matching in type with the type
 * given as a param.
 *
 * @param documents
 * @param type: type of the find which we want to declare to be INSTANCE_OF Type.
 * @param find
 *
 * @author Daniel de Oliveira
 */
export async function suggestTypeRelations(documents: Array<FieldDocument>,
                                           type: Name,
                                           find: (query: Query) => Promise<FieldDocumentFindResult>)
    : Promise<Array<FieldDocument>> {

    const rows: Array<Row> = await asyncMap(async (document: FieldDocument) => {

        const constraints = { constraints: { 'isInstanceOf:contain': document.resource.id }};
        const documents = (await find(constraints)).documents as Array<FieldDocument>;

        // pairWith
        return [document, documents] as Row;

    })(documents);

    const result = separate(([_, connected]: Row) => {

        const types = connected.map(to('resource.type'));
        const typesMatchingTypeNotMatching = separate(is(type))(types);
        return typesMatchingTypeNotMatching[0] > typesMatchingTypeNotMatching[1];

    })(rows);
    return (result[0].concat(result[1])).map(first) as Array<FieldDocument>;
}