import {NativeJsonlParser} from '../../../../app/core/import/native-jsonl-parser';
import {M} from '../../../../app/components/m';
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

        let fileContent  = '{ "id": "id1", "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "id": "id2", "type": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
            + '{ "id": "id3", "type": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        let parser = new NativeJsonlParser();
        let objects = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, () => {
            fail();
            done();
        }, () => {
            expect(objects[0]['resource']['id']).toEqual('id1');
            expect(objects[0]['resource']['type']).toEqual('Find');
            expect(objects[2]['resource'].title).toEqual('Obi-Three Kenobi');
            expect(objects.length).toEqual(3);
            done();
        });

    });

    it('should abort on syntax errors in file content', (done) => {

        let fileContent = '{ "id": "id1", "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "id": "id2", "type": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
            + '{ "id": "id3", "type": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        let parser = new NativeJsonlParser();
        let objects = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, (error) => {
            expect(objects.length).toEqual(1);
            expect(objects[0]['resource']['id']).toEqual('id1');
            expect(error).toEqual([ImportErrors.FILE_INVALID_JSONL,2]);
            done();
        });

    });

});
