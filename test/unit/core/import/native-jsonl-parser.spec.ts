import {NativeJsonlParser} from '../../../../app/core/import/native-jsonl-parser';
import {ImportErrors} from '../../../../app/core/import/import-errors';

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
describe('NativeJsonlParser', () => {

    beforeEach(
        function() {
            spyOn(console, 'error'); // to suppress console.error output
        }
    );

   it('should create objects from file content', (done) => {

        let fileContent  = '{ "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "type": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
            + '{ "type": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        let parser = new NativeJsonlParser();
        let objects = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, () => {
            fail();
            done();
        }, () => {
            expect(objects[0]['resource']['type']).toEqual('Find');
            expect(objects[2]['resource'].title).toEqual('Obi-Three Kenobi');
            expect(objects.length).toEqual(3);
            done();
        });

   });


   it('should abort on syntax errors in file content', (done) => {

        let fileContent = '{ "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "type": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
            + '{ "type": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        let parser = new NativeJsonlParser();
        let objects = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, (error) => {
            expect(objects.length).toEqual(1);
            expect(error).toEqual([ImportErrors.FILE_INVALID_JSONL,2]);
            done();
        });
    });


    it('abort if id found', (done) => {

        let fileContent = '{ "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "type": "Find", "identifier" : "ob3", "id" : "abc", "title": "Obi-Three Kenobi"}';

        let parser = new NativeJsonlParser();
        let objects = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, (error) => {
            expect(objects.length).toEqual(1);
            expect(error).toEqual([ImportErrors.PARSER_ID_MUST_NOT_BE_SET]);
            done();
        });
    });
});
