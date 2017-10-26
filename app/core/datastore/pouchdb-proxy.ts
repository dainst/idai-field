/**
 * @author Sebastian Cuy
 */
export class PouchdbProxy {


    constructor(private rdy: Promise<any>) {}


    public ready() {

        return this.rdy;
    }


    public put(document: any, options?: any): Promise<any> {

        return this.rdy.then(db => db.put(document, options));
    }


    public remove(document: any, revisionId?: any): Promise<any> {

        return this.rdy.then(db => db.remove(document, revisionId));
    }


    public query(index: any, opts: any): Promise<any> {

        return this.rdy.then(db => db.query(index, opts));
    }


    public sync(url: any, opts: any): Promise<any> {

        return this.rdy.then(db => db.sync(url, opts));
    }


    public get(id: any, opts={}): Promise<any> {

        return this.rdy.then(db => db.get(id, opts));
    }


    public changes(opts: any): Promise<any> {

        return this.rdy.then(db => db.changes(opts));
    }


    public putAttachment(docId: any, attachmentId: any, rev: any, attachment: any, type: any): Promise<any> {

        return this.rdy.then(db => db.putAttachment(docId, attachmentId, rev, attachment, type));
    }


    public getAttachment(docId: any, attachmentId: any): Promise<any> {

        return this.rdy.then(db => db.getAttachment(docId, attachmentId));
    }


    public removeAttachment(docId: any, attachmentId: any, rev: any): Promise<any> {

        return this.rdy.then(db => db.removeAttachment(docId, attachmentId, rev));
    }

}