import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdigCsvParser} from '../../../app/import/idig-csv-parser';
import {M} from '../../../app/m';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    beforeEach(
        function(){
            spyOn(console, 'error'); // to suppress console.error output
        }
    );

    describe('IdigCsvParser', () => {

        it('should create documents from file content', (done) => {

            let fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + '2,two,Two,context\n';

            let parser = new IdigCsvParser();
            let documents: Array<IdaiFieldDocument> = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument as IdaiFieldDocument);
            }, (err) => {
                console.error(err);
                fail();
            }, () => {
                expect(documents.length).toBe(2);
                expect(parser.getWarnings().length).toBe(0);
                expect(documents[0].resource.id).toEqual('1');
                expect(documents[0].resource.type).toEqual('context');
                expect(documents[1].resource.shortDescription).toEqual('Two');
                done();
            });

        });

        it('should abort on syntax errors in file content', (done) => {

            let fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + ',two,Two,context\n';

            let parser = new IdigCsvParser();
            let documents: Array<IdaiFieldDocument> = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument as IdaiFieldDocument);
            }, (msgWithParams) => {
                expect(documents.length).toBe(1);
                expect(documents[0].resource.id).toEqual('1');
                expect(msgWithParams).toEqual([M.IMPORT_FAILURE_MANDATORYCSVFIELDMISSING, 2, 'IdentifierUUID']);
                done();
            });

        });

        it('should parse point, polygon and multipolygon geometries', (done) => {

            let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	context	POINT ((416,361 354,404))\n'
                + '2	two	Two	context	POLYGON ((415,732 354,88, 416,982 353,988, 416,227 352,992, 415,732 354,88))\n'
                + '3	three	Three	context	MULTIPOLYGON ((407,259 356,711, 407,25 356,417, 407,29 356,430, '
                + '407,259 356,711), (406,432 356,684, 406,46 356,698, 406,50 356,690, 406,432 356,684))\n';

            let parser = new IdigCsvParser();
            let documents: Array<IdaiFieldDocument> = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument as IdaiFieldDocument);
            }, (err) => {
                console.error(err);
                fail();
            }, () => {
                expect(documents.length).toBe(3);
                expect(parser.getWarnings().length).toBe(0);
                expect(documents[0].resource.geometry.type).toEqual('Point');
                expect(documents[0].resource.geometry.coordinates).toEqual([416.361, 354.404]);
                expect(documents[1].resource.geometry.type).toEqual('Polygon');
                expect(documents[1].resource.geometry.coordinates).toEqual(
                    [[[415.732, 354.88], [416.982, 353.988], [416.227, 352.992], [415.732, 354.88]]]);
                done();
                expect(documents[2].resource.geometry.type).toEqual('MultiPolygon');
                expect(documents[2].resource.geometry.coordinates).toEqual(
                    [[[[407.259, 356.711], [407.25, 356.417], [407.29, 356.430], [407.259, 356.711]]],
                        [[[406.432, 356.684], [406.46, 356.698], [406.50, 356.690], [406.432, 356.684]]]]);
                done();
            });

        });

        it('should abort on invalid geometries', (done) => {

            let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	context	POINT ((416,361 354,404))\n'
                + '2	two	Two	context	POINT ((416,361 354,404 354,404))\n';

            let parser = new IdigCsvParser();
            let documents: Array<IdaiFieldDocument> = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument as IdaiFieldDocument);
            }, (err) => {
                expect(documents.length).toBe(1);
                expect(documents[0].resource.id).toEqual('1');
                expect(err).toEqual([M.IMPORT_FAILURE_INVALIDGEOMETRY, 2]);
                done();
            });

        });

    });
}
