declare function emit(key:any, value?:any):void;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class IndexCreator {

    public go(db) {
        return this.setupFulltextIndex(db)
            .then(() => this.setupIdentifierIndex(db))
            .then(() => this.setupSyncedIndex(db))
            .then(() => this.setupBelongsToIndex(db))
            .then(() => this.setupAllIndex(db));
    }

    private setupFulltextIndex(db): Promise<any> {
        db.on('error', err => console.error(err.toString()));
        let mapFun = function(doc) {
            const types = ['', doc.resource.type].concat(doc.resource['_parentTypes']);
            if (types.indexOf('image') == -1) types.push('resource');
            types.forEach(function(type) {
                if (doc.resource.shortDescription)
                    doc.resource.shortDescription.split(/[.;,\- ]+/)
                        .forEach(token => emit([type, token.toLowerCase()]));
                if (doc.resource.identifier)
                    emit([type, doc.resource.identifier.toLowerCase()]);
            });
        };
        return this.setupIndex(db,'fulltext', mapFun);
    }

    private setupSyncedIndex(db): Promise<any> {
        let mapFun = function(doc) {
            emit(doc.synced);
        };
        return this.setupIndex(db,'synced', mapFun);
    }

    private setupIdentifierIndex(db): Promise<any> {
        let mapFun = function(doc) {
            emit(doc.resource.identifier);
        };
        return this.setupIndex(db,'identifier', mapFun);
    }

    private setupAllIndex(db): Promise<any> {
        let mapFun = function(doc) {
            const types = ['', doc.resource.type].concat(doc.resource['_parentTypes']);
            if (types.indexOf('image') == -1) types.push('resource');
            types.forEach(type => emit([type, doc.modified]));
        };
        return this.setupIndex(db,'all', mapFun);
    }

    private setupBelongsToIndex(db): Promise<any> {
        let mapFun = function(doc) {
            if (doc.resource.relations['belongsTo'] != undefined) {
                doc.resource.relations['belongsTo'].forEach(identifier => emit(identifier));
            }
        };
        return this.setupIndex(db,'belongsTo', mapFun);
    }

    private setupIndex(db, id, mapFun) {

        let ddoc = {
            _id: '_design/' + id,
            views: { }
        };
        ddoc.views[id] = { map: mapFun.toString() };

        return db.put(ddoc).then(
            () => {},
            err => {
                if (err.name !== 'conflict') {
                    throw err;
                }
            }
        );
    }
}