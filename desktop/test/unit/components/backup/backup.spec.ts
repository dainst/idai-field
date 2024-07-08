import { describe, test, beforeAll, afterEach, afterAll, jest } from '@jest/globals';
import { nop } from 'tsfun';
import { Backup } from '../../../../src/app/components/backup/backup';

import fs = require('fs');
import rimraf = require('rimraf');
import PouchDB = require('pouchdb-node');


/**
 * @author Daniel de Oliveira
 */
describe('Backup', () => {

    const backupFilePath = process.cwd() + '/test/store/backup_test_file.txt';


    beforeAll(() => {
        
        jest.spyOn(console, 'warn').mockImplementation(nop);
    });


    afterEach(done => {

        rimraf(backupFilePath, () => {
            rimraf(process.cwd() + '/unittest', () => done());
        });
    });


    afterAll(() => {

        (console.warn as any).mockRestore();
    });


    test('do a backup', async () => {

        const db = await new PouchDB('unittest');
        await db.put({ '_id' : 'a1', a: { b: 'c' }});
        await db.put({ '_id' : 'a2', a: { b: 'd' }});
        await Backup.dump(backupFilePath, 'unittest');

        const data = fs.readFileSync(backupFilePath);
        const docs = JSON.parse(data.toString().split('\n')[1])['docs'];

        expect(docs[0].a.b).toEqual('c');
        expect(docs[1].a.b).toEqual('d');
        expect(docs[0]['_id']).toEqual('a1');
        expect(docs[1]['_id']).toEqual('a2');

        db.close();
    });
});
