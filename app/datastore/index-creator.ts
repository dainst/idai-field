declare function emit(key: any, value?: any): void;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class IndexCreator {

    public go(db) {
        return this.setupFulltextIndex(db)
            .then(() => this.setupConflictedIndex(db));
    }

    private setupFulltextIndex(db): Promise<any> {
        db.on('error', err => console.error(err.toString()));
        let mapFun = function(doc) {
            if (!doc.resource || !doc.resource.type) return;
            const types = ['', doc.resource.type].concat(doc.resource['_parentTypes']);
            if (types.indexOf('image') == -1) types.push('resource');

            let lastModified = doc.created.date;
            if (doc.modified && doc.modified.length > 0)
                lastModified = doc.modified[doc.modified.length - 1].date;

            types.forEach(function(type) {
                if (doc.resource.shortDescription)
                    doc.resource.shortDescription.split(/[.;,\- ]+/)
                        .forEach(token => emit([type, token.toLowerCase(),lastModified]));
                if (doc.resource.identifier)
                    emit([type, doc.resource.identifier.toLowerCase(), lastModified]);
            });
        };
        return this.setupIndex(db,'fulltext', mapFun);
    }

    private setupConflictedIndex(db): Promise<any> {
        let mapFun = function(doc) {
            if (!doc.resource) return;
            if (doc['_conflicts']) {
                let lastModified = doc.created.date;
                if (doc.modified && doc.modified.length > 0)
                    lastModified = doc.modified[doc.modified.length - 1].date;
                emit(lastModified);
            }
        };
        return this.setupIndex(db, 'conflicted', mapFun);
    }

    private setupIndex(db, id, mapFun) {

        let designDocument = {
            _id: '_design/' + id,
            views: { }
        };
        designDocument.views[id] = { map: mapFun.toString() };

        return db.put(designDocument).then(
            () => {},
            err => {
                if (err.name !== 'conflict') {
                    throw err;
                }
            }
        );
    }
}