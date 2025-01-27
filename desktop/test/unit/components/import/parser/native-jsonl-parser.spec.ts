import { nop } from 'tsfun';
import { NativeJsonlParser } from '../../../../../src/app/components/import/parser/native-jsonl-parser';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
describe('NativeJsonlParser', () => {

    beforeAll(() => {

        jest.spyOn(console, 'error').mockImplementation(nop);
    });


    afterAll(() => {

        (console.error as any).mockRestore();
    });


    test('should create objects from file content', async () => {

        const fileContent  = '{ "category": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        const objects = await NativeJsonlParser.parse(fileContent);

        expect(objects[0]['resource']['category']).toEqual('Find');
        expect(objects[2]['resource'].title).toEqual('Obi-Three Kenobi');
        expect(objects.length).toEqual(3);
    });


    test('should abort on syntax errors in file content', async () => {

        const fileContent = '{ "category": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
            + '{ "category": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

        try {
            await NativeJsonlParser.parse(fileContent);
            throw new Error('Test failure');
        } catch (err) {
            expect(err).toEqual([ParserErrors.FILE_INVALID_JSONL, 2]);
        }
    });


    test('abort if id found', async () => {

        const fileContent = '{ "category": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "category": "Find", "identifier" : "ob3", "id" : "abc", "title": "Obi-Three Kenobi"}';

        try {
            await NativeJsonlParser.parse(fileContent);
            throw new Error('Test failure');
        } catch (err) {
            expect(err).toEqual([ParserErrors.ID_MUST_NOT_BE_SET]);
        }
    });
});
