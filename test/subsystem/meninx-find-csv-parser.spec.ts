import {MeninxFindCsvParser} from '../../app/core/import/meninx-find-csv-parser';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('MeninxCsvParser', () => {

        it('abc', async done => {

            const fileContent = 'se,id,description\n'
                + '1001,1,hallohallo1\n'
                + '1001,2,hallohallo2\n';

            const documents = [];
            new MeninxFindCsvParser().parse(fileContent).forEach(document => {
                documents.push(document);
            }).then(() => {
                expect(documents[0].resource.identifier).toEqual('1001-1');
                expect(documents[1].resource.identifier).toEqual('1001-2');
                expect(documents[0].resource.relations.liesWithin[0]).toEqual('1001');
                expect(documents[1].resource.relations.liesWithin[0]).toEqual('1001');
                done();
            });
        });
    })
}