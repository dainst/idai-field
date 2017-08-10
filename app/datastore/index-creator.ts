declare function emit(key: any, value?: any): void;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class IndexCreator {

    public go(db) {
        return this.setupConflictedIndex(db);
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