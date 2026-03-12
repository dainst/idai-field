/// <reference lib="webworker" />

const replicationStream = require('../../../../node_modules/pouchdb-replication-stream/dist/pouchdb.replication-stream');
const stream = require('stream');
const fs = require('fs');
const PouchDB = require('pouchdb-browser').default;


suppressDeprecationWarnings();

addEventListener('message', async ({ data }) => {

    const project: string = data.project;
    const targetFilePath: string = data.targetFilePath;
    const creationDate: Date = data.creationDate;

    try {
        const updateSequence: number = await createBackup(project, targetFilePath);

        postMessage({
            success: true,
            project,
            targetFilePath,
            updateSequence,
            creationDate
        });
    } catch (err) {
        postMessage({ success: false, error: err });
        return;
    }
});


async function createBackup(project: string, filePath: string): Promise<number> {

    let database: any;

    try {
        PouchDB.plugin(replicationStream.plugin);
        (PouchDB as any).adapter('writableStream', replicationStream.adapters.writableStream);

        let dumpedString: string = '';
        const memoryStream = new stream.Writable();
        memoryStream._write = (chunk: any, _: any, done: any) => {
            dumpedString += chunk.toString().replace(/"data"[\s\S]+?,/g,'\"data\":\"\",');
            done();
        };

        database = new PouchDB(project);
        await database.dump(memoryStream, { attachments: false });
        const updateSequence: number = (await database.info()).update_seq;
        fs.writeFileSync(filePath, dumpedString);

        return updateSequence;
    } finally {
        if (database) await database.close();
    }
}


function suppressDeprecationWarnings() {

    const warnFunction = console.warn;

    console.warn = function() {
      if (!arguments[0].includes('deprecated')) return warnFunction.apply(console, arguments);
    };
}
