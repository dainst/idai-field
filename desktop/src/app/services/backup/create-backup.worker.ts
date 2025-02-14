/// <reference lib="webworker" />

const replicationStream = require('../../../../node_modules/pouchdb-replication-stream/dist/pouchdb.replication-stream');
const stream = require('stream');
const fs = require('fs');
const PouchDB = require('pouchdb-browser').default;


suppressDeprecationWarnings();

addEventListener('message', async ({ data }) => {

    const project: string = data.project;
    const targetFilePath: string = data.targetFilePath;

   try {
        await dump(targetFilePath, project);
    } catch (err) {
        postMessage({ success: false, error: err });
    }

    postMessage({ success: true });
});


export async function dump(filePath: string, project: string) {

    PouchDB.plugin(replicationStream.plugin);
    (PouchDB as any).adapter('writableStream', replicationStream.adapters.writableStream);

    let dumpedString = '';
    const memoryStream = new stream.Writable();
    memoryStream._write = (chunk: any, _: any, done: any) => {
        dumpedString += chunk.toString().replace(/"data"[\s\S]+?,/g,'\"data\":\"\",');
        done();
    };
    await new PouchDB(project).dump(memoryStream, { attachments: false });
    fs.writeFileSync(filePath, dumpedString);
}


function suppressDeprecationWarnings() {

    const warnFunction = console.warn;

    console.warn = function() {
      if (!arguments[0].includes('deprecated')) return warnFunction.apply(console, arguments);
    };
}
