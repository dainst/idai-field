export class PouchdbProxy {

    constructor(
        private rdy: Promise<any> // TODO should be private and accessed through ready()
    ) { }

    public switchDb(rdy: Promise<any>) {
        this.rdy = rdy;
    }

    public ready() {
        return this.rdy;
    }

    public put(document, options?): Promise<any> {
        return this.rdy.then(db => db.put(document, options));
    }

    public remove(document, revisionId?): Promise<any> {
        return this.rdy.then(db => db.remove(document, revisionId));
    }

    public query(index, opts): Promise<any> {
        return this.rdy.then(db => db.query(index, opts));
    }

    // TODO remove it
    public allDocs(cb): Promise<any> {
        return this.rdy.then(db => db.allDocs(cb));
    }

    public sync(url, opts): Promise<any> {
        return this.rdy.then(db => db.sync(url, opts));
    }

    public get(id, opts={}): Promise<any> {
        return this.rdy.then(db => db.get(id, opts));
    }

    public changes(opts): Promise<any> {
        return this.rdy.then(db => db.changes(opts));
    }

    public putAttachment(docId, attachmentId, rev, attachment, type): Promise<any> {
        return this.rdy.then(db => db.putAttachment(docId, attachmentId, rev, attachment, type));
    }

    public getAttachment(docId, attachmentId): Promise<any> {
        return this.rdy.then(db => db.getAttachment(docId, attachmentId));
    }

    public removeAttachment(docId, attachmentId, rev): Promise<any> {
        return this.rdy.then(db => db.removeAttachment(docId, attachmentId, rev));
    }

}