export class PouchdbProxy {

    constructor(public rdy: Promise<any>) { }

    public put(document): Promise<any> {
        return this.rdy.then(db => db.put(document));
    }

    public remove(document): Promise<any> {
        return this.rdy.then(db => db.remove(document));
    }

    public query(index, opts): Promise<any> {
        return this.rdy.then(db => db.query(index, opts));
    }

    public sync(url, opts): Promise<any> {
        return this.rdy.then(db => db.sync(url, opts));
    }

    public get(id, opts): Promise<any> {
        return this.rdy.then(db => db.get(id, opts));
    }

    public changes(opts): Promise<any> {
        return this.rdy.then(db => db.changes(opts));
    }

}