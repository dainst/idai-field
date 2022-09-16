import { NativeJsonlParser } from '../../../../../src/app/components/import/parser/native-jsonl-parser';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


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

   it('should create objects from file content', done => {

        let fileContent  = '{ "category": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        let parse = NativeJsonlParser.parse;
        parse(fileContent).then(objects => {
            // expect(resultDocument).not.toBe(undefined);
            // objects.push(resultDocument);
            expect(objects[0]['resource']['category']).toEqual('Find');
            expect(objects[2]['resource'].title).toEqual('Obi-Three Kenobi');
            expect(objects.length).toEqual(3);
            done();
        }, () => {
            fail();
            done();
        });

   });


   it('should abort on syntax errors in file content', done => {

        let fileContent = '{ "category": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
            + '{ "category": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        let parse = NativeJsonlParser.parse;
        let objects = [];
        parse(fileContent).then(resultDocument => {
            // expect(resultDocument).not.toBe(undefined);
            // objects.push(resultDocument);
            fail();
            done();
        }, (error) => {
            // expect(objects.length).toEqual(1);
            expect(error).toEqual([ParserErrors.FILE_INVALID_JSONL,2]);
            done();
        });
   });


   it('abort if id found', done => {

        let fileContent = '{ "category": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob3", "id" : "abc", "title": "Obi-Three Kenobi"}';

        let parse = NativeJsonlParser.parse;
        // let objects = [];
        parse(fileContent).then(resultDocument => {
            // expect(resultDocument).not.toBe(undefined);
            // objects.push(resultDocument);
            done();
        }, (error) => {
            // expect(objects.length).toEqual(1);
            expect(error).toEqual([ParserErrors.ID_MUST_NOT_BE_SET]);
            done();
        });
    });
});
