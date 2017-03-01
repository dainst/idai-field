import {IdigCsvParser} from "../../app/import/idig-csv-parser";
import {M} from "../../app/m";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export function main() {

    describe('IdigCsvParser', () => {

        it('should create objects from file content', (done) => {

            let fileContent  = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + '2,two,Two,context\n';

            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(result => {
                expect(result).not.toBe(undefined);
                objects.push(result.document);
            }, () => {
                fail();
            }, () => {
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(objects[0]['resource']['type']).toEqual("context");
                expect(objects[1]['resource'].shortDescription).toEqual("Two");
                expect(objects.length).toEqual(2);
                done();
            });

        });

        it('should abort on syntax errors in file content', (done) => {

            let fileContent  = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + ',two,Two,context\n';
            
            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(result => {
                expect(result).not.toBe(undefined);
                objects.push(result.document);
            }, (msgWithParams) => {
                expect(objects.length).toEqual(1);
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(msgWithParams).toEqual([M.IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING,2,'IdentifierUUID']);
                done();
            });

        });

    });
}
