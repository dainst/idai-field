import {MeninxCsvParser} from '../../app/core/import/meninx-csv-parser';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('MeninxCsvParser', () => {

        it('abc', async done => {

            const fileContent = 'feature,id,description\n'
                + 'context1,imported1,hallohallo\n'
                + 'context1,imported2,hallohallo\n';

            const documents = [];
            new MeninxCsvParser().parse(fileContent).forEach(document => {
                documents.push(document);
            }).then(() => {
                expect(documents[0].resource.id).toEqual('imported1');
                expect(documents[1].resource.id).toEqual('imported2');
                expect(documents[0].resource.relations.liesWithin[0]).toEqual('context1');
                expect(documents[1].resource.relations.liesWithin[0]).toEqual('context1');
                done();
            });
        });
    })
}