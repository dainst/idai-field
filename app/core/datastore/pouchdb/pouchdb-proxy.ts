/**
 * @author Sebastian Cuy
 */
export class PouchdbProxy {


    constructor(private rdy: Promise<any>) {}


    public ready() {

        return this.rdy;
    }


    public put(document: any, options: any = {}): Promise<any> {

        return this.rdy.then(db => db.put(document, options));
    }


    public bulkDocs(documents: Array<any>, options: any = {}): Promise<any> {

        return this.rdy.then(db => db.bulkDocs(documents, options));
    }


    public remove(document: any, revisionId?: any): Promise<any> {

        return this.rdy.then(db => db.remove(document, revisionId));
    }


    public query(index: any, options: any): Promise<any> {

        return this.rdy.then(db => db.query(index, options));
    }


    public sync(url: any, options: any): Promise<any> {

        return this.rdy.then(db => db.sync(url, options));
    }


    public get(id: any, options = {}): Promise<any> {

        return this.rdy.then(db => db.get(id, options));
    }


    public allDocs(options = {}): Promise<any> {

        return this.rdy.then(db => db.allDocs(options));
    }


    public changes(options: any): Promise<any> {

        return this.rdy.then(db => db.changes(options));
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