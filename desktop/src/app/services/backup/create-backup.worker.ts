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
        await createBackup(targetFilePath, project);
    } catch (err) {
        postMessage({ success: false, error: err });
    }

    postMessage({
        success: true,
        project,
        targetFilePath,
        updateSequence: await getUpdateSequence(project),
        creationDate
    });
});


export async function createBackup(filePath: string, project: string) {

    PouchDB.plugin(replicationStream.plugin);
    (PouchDB as any).adapter('writableStream', replicationStream.adapters.writableStream);

    let dumpedString: string = '';
    const memoryStream = new stream.Writable();
    memoryStream._write = (chunk: any, _: any, done: any) => {
        dumpedString += removeAttachments(chunk.toString());
        done();
    };
    await new PouchDB(project).dump(memoryStream, { attachments: false });
    fs.writeFileSync(filePath, dumpedString);
}


function removeAttachments(line: string): string {

    if (!line.includes('"_attachments"')) return line;

    const entry: any = JSON.parse(line);
    if (!Array.isArray(entry.docs)) return line;

    entry.docs.forEach(document => delete document._attachments);

    return JSON.stringify(entry) + '\n';
}


function suppressDeprecationWarnings() {

    const warnFunction = console.warn;

    console.warn = function() {
      if (!arguments[0].includes('deprecated')) return warnFunction.apply(console, arguments);
    };
}


async function getUpdateSequence(project: string): Promise<number|undefined> {

    return (await new PouchDB(project).info()).update_seq;
}
