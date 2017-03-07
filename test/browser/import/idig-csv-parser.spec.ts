import {IdigCsvParser} from "../../../app/import/idig-csv-parser";
import {M} from "../../../app/m";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('IdigCsvParser', () => {

        it('should create objects from file content', (done) => {

            let fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + '2,two,Two,context\n';

            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                objects.push(resultDocument);
            }, (err) => {
                console.error(err);
                fail();
            }, () => {
                expect(objects.length).toBe(2);
                expect(parser.getWarnings().length).toBe(0);
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(objects[0]['resource']['type']).toEqual("context");
                expect(objects[1]['resource'].shortDescription).toEqual("Two");
                done();
            });

        });

        it('should abort on syntax errors in file content', (done) => {

            let fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + ',two,Two,context\n';

            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                objects.push(resultDocument);
            }, (msgWithParams) => {
                expect(objects.length).toBe(1);
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(msgWithParams).toEqual([M.IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING,2,'IdentifierUUID']);
                done();
            });

        });

        it('should parse point and polygon geometries', (done) => {

            let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	context	POINT ((416,361 354,404))\n'
                + '2	two	Two	context	POLYGON ((415,732 354,88, 416,982 353,988, 416,227 352,992, 415,732 354,88))\n';

            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                objects.push(resultDocument);
            }, (err) => {
                console.error(err);
                fail();
            }, () => {
                expect(objects.length).toBe(2);
                expect(parser.getWarnings().length).toBe(0);
                expect(objects[0]['resource']['geometries'][0]['type']).toEqual('Point');
                expect(objects[0]['resource']['geometries'][0]['coordinates']).toEqual([416.361, 354.404]);
                expect(objects[1]['resource']['geometries'][0]['type']).toEqual('Polygon');
                expect(objects[1]['resource']['geometries'][0]['coordinates']).toEqual(
                    [[[415.732, 354.88], [416.982, 353.988], [416.227, 352.992], [415.732, 354.88]]]);
                done();
            });

        });

        it('should abort on invalid geometries', (done) => {

            let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	context	POINT ((416,361 354,404))\n'
                + '2	two	Two	context	POINT ((416,361 354,404 354,404))\n';

            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                objects.push(resultDocument);
            }, (err) => {
                expect(objects.length).toBe(1);
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(err).toEqual([M.IMPORTER_FAILURE_INVALIDGEOMETRY, 2]);
                done();
            });

        });

        it('should produce warnings for unsupported geometry types', (done) => {

            let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	context	MULTIPOLYGON ((407,259 356,711, 407,25 356,417, 407,29 356,430, '
                + '407,259 356,711),(406,432 356,684, 406,46 356,698, 406,50 356,690, 406,432 356,684))\n';

            let parser = new IdigCsvParser();
            let objects = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                objects.push(resultDocument);
            }, (err) => {
                console.error(err);
                fail();
            }, () => {
                expect(objects.length).toBe(1);
                expect(parser.getWarnings().length).toBe(1);
                expect(parser.getWarnings()[0]).toEqual([M.IMPORTER_WARNING_NOMULTIPOLYGONSUPPORT]);
                done();
            });

        });

    });
}
