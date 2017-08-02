declare function emit(key: any, value?: any): void;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class IndexCreator {

    public go(db) {
        return this.setupFulltextIndex(db)
            .then(() => this.setupIdentifierIndex(db))
            .then(() => this.setupIsRecordedInIndex(db))
            .then(() => this.setupLiesWithinIndex(db))
            .then(() => this.setupConflictedIndex(db));
    }

    public hasIndex(indexName: string) {
        return (([
            'resource.identifier',
            'resource.relations.isRecordedIn',
            'resource.relations.liesWithin',
            'conflicted',
            'fulltext',
            ]).indexOf(indexName) != -1);
    }

    private setupFulltextIndex(db): Promise<any> {
        db.on('error', err => console.error(err.toString()));
        let mapFun = function(doc) {
            if (!doc.resource || !doc.resource.type) return;
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

    private setupIdentifierIndex(db): Promise<any> {
        let mapFun = function(doc) {
            if (!doc.resource || !doc.resource.identifier) return;
            emit([doc.resource.identifier]);
        };
        return this.setupIndex(db, 'resource.identifier', mapFun);
    }

    private setupIsRecordedInIndex(db): Promise<any> {
        let mapFun = function(doc) {
            if (!doc.resource) return;
            // split identifier and convert numbers to achieve desired order
            var identifier = doc.resource.identifier.split(/(\d+)/);
            identifier = identifier.map(s => /^\d+$/.test(s) ? parseInt(s) : s);
            if (doc.resource.relations['isRecordedIn'] != undefined) {
                doc.resource.relations['isRecordedIn'].forEach(resourceId =>
                    emit([resourceId, doc.resource.type].concat(identifier)));
            } else {
                emit(['UNKNOWN', doc.resource.type].concat(identifier));
            }
        };
        return this.setupIndex(db, 'resource.relations.isRecordedIn', mapFun);
    }

    private setupLiesWithinIndex(db): Promise<any> {
        let mapFun = function(doc) {
            if (!doc.resource) return;
            // split identifier and convert numbers to achieve desired order
            var identifier = doc.resource.identifier.split(/(\d+)/);
            identifier = identifier.map(s => /^\d+$/.test(s) ? parseInt(s) : s);
            if (doc.resource.relations['liesWithin'] != undefined) {
                doc.resource.relations['liesWithin'].forEach(resourceId =>
                    emit([resourceId, doc.resource.type].concat(identifier)));
            } else {
                emit(['UNKNOWN', doc.resource.type].concat(identifier));
            }
        };
        return this.setupIndex(db,'resource.relations.liesWithin', mapFun);
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