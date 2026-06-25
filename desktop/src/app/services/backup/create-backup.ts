import PouchDB from 'pouchdb-browser';
import { electronFs as fs } from 'src/app/electron/electron';


const ADAPTER_NAME = 'backupDump';
const DEFAULT_BATCH_SIZE = 50;
const DUMP_FORMAT_VERSION = '0.1.0';

const ERROR_REV_CONFLICT = {
    status: 409,
    name: 'conflict',
    message: 'Document update conflict'
};

const ERROR_MISSING_DOC = {
    status: 404,
    name: 'not_found',
    message: 'missing'
};

let adapterRegistered = false;

type Callback = (error?: any, result?: any) => void;
type ChunkWriter = (chunk: string) => void;


export async function createBackupFile(filePath: string, project: string): Promise<number|undefined> {

    ensureAdapterRegistered();

    let dumpedString = '';
    const appendChunk = (chunk: string) => dumpedString += stripAttachmentData(chunk);

    const database: any = new PouchDB(project);
    const output: any = new PouchDB(project, { adapter: ADAPTER_NAME });
    output.setupWriter(appendChunk);

    await withoutDeprecationWarnings(async () => {
        const info = await database.info();
        appendChunk(JSON.stringify({
            version: DUMP_FORMAT_VERSION,
            db_type: database.type(),
            start_time: new Date().toJSON(),
            db_info: info
        }) + '\n');

        await database.replicate.to(output, { batch_size: DEFAULT_BATCH_SIZE });
        await output.close();
    });

    fs.writeFileSync(filePath, dumpedString);

    return getUpdateSequence(project, database);
}


export async function getUpdateSequence(project: string, database: any = undefined): Promise<number|undefined> {

    const db = database ?? new PouchDB(project);

    return (await db.info()).update_seq;
}


function ensureAdapterRegistered() {

    if (adapterRegistered) return;

    (PouchDB as any).adapter(ADAPTER_NAME, BackupDumpAdapter);
    adapterRegistered = true;
}


function BackupDumpAdapter(this: any, opts: any, callback: Callback) {

    const api: any = this;
    api.instanceId = Math.random().toString();
    api.localStore = {};
    api.originalName = opts.name;
    api.writeChunk = undefined;

    api.setupWriter = (writer: ChunkWriter) => api.writeChunk = writer;
    api.type = () => ADAPTER_NAME;
    api._remote = false;

    api._id = (done?: Callback) => {
        const promise = Promise.resolve(api.instanceId);
        if (done) promise.then(id => done(null, id), done);
        return promise;
    };

    api._bulkDocs = (req: any, options: any, done: Callback) => {
        const docs = req.docs;

        if (options.new_edits === false) {
            if (!api.writeChunk) return done(new Error('Backup writer has not been initialized'));

            api.writeChunk(JSON.stringify({ docs }) + '\n');
            done(null, docs.map((doc: any) => ({ ok: true, id: doc._id, rev: doc._rev })));
        } else {
            docs.forEach((doc: any) => api.localStore[doc._id] = doc);
            done(null, docs.map((doc: any) => ({ ok: true, id: doc._id, rev: doc._rev })));
        }
    };

    api._getRevisionTree = (_docId: string, done: Callback) => defer(() => done(ERROR_MISSING_DOC));

    api._close = (done: Callback) => defer(() => done());

    api._getLocal = (id: string, done: Callback) => defer(() => {
        const existingDoc = api.localStore[id];
        existingDoc
            ? done(null, existingDoc)
            : done(ERROR_MISSING_DOC);
    });

    api._putLocal = (doc: any, options: any, done: Callback) => {
        if (typeof options === 'function') {
            done = options;
            options = {};
        }

        delete doc._revisions;

        const oldRev = doc._rev;
        const id = doc._id;
        const newRev = doc._rev = oldRev
            ? '0-' + (parseInt(oldRev.split('-')[1], 10) + 1)
            : '0-1';

        defer(() => {
            const existingDoc = api.localStore[id];
            if (existingDoc && oldRev !== existingDoc._rev) {
                done(ERROR_REV_CONFLICT);
            } else {
                api.localStore[id] = doc;
                if ('last_seq' in doc) api.writeChunk(JSON.stringify({ seq: doc.last_seq }) + '\n');
                done(null, { ok: true, id, rev: newRev });
            }
        });
    };

    api._removeLocal = (doc: any, done: Callback) => defer(() => {
        const existingDoc = api.localStore[doc._id];
        if (existingDoc && doc._rev !== existingDoc._rev) {
            done(ERROR_REV_CONFLICT);
        } else {
            delete api.localStore[doc._id];
            done(null, { ok: true, id: doc._id, rev: '0-0' });
        }
    });

    api._destroy = (options: any, done: Callback) => {
        if (typeof options === 'function') done = options;
        defer(() => done(null, { ok: true }));
    };

    defer(() => callback(null, api));
}


(BackupDumpAdapter as any).valid = () => true;


function defer(task: () => void) {

    Promise.resolve().then(task);
}


async function withoutDeprecationWarnings<T>(task: () => Promise<T>): Promise<T> {

    const warnFunction = console.warn;

    console.warn = function(...args: Array<any>) {
        if (!args[0]?.includes?.('deprecated')) return warnFunction.apply(console, args);
    };

    try {
        return await task();
    } finally {
        console.warn = warnFunction;
    }
}


function stripAttachmentData(chunk: string): string {

    return chunk.replace(/"data"[\s\S]+?,/g, '"data":"",');
}
