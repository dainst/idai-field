/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndexer {

    private index = undefined;
    private dates = {}; // map: resourceId => date

    constructor(private pathsDefinitions) {
        this.setUp();
    }

    public clear() {
        this.setUp();
    }

    private build(doc, pathDef) {

        this.dates[doc.resource.id] = ConstraintIndexer.getLastModified(doc);

        if (!ConstraintIndexer.getElForPathIn(doc, pathDef.path)) {
            return this.addToIndex(doc, pathDef.path, 'UNKOWN');
        }

        if (pathDef.string) {
            this.addToIndex(doc, pathDef.path,
                ConstraintIndexer.getElForPathIn(doc, pathDef.path));
        } else {
            for (let target of ConstraintIndexer.getElForPathIn(doc, pathDef.path)) {
                this.addToIndex(doc, pathDef.path, target);
            }
        }
    }


    public remove(doc) {
        for (let pathDef of this.pathsDefinitions) {
            for (let key of Object.keys(this.index[pathDef.path])) {
                if (this.index[pathDef.path][key][doc.resource.id])
                    delete this.index[pathDef.path][key][doc.resource.id];
            }
        }
    }

    public update(doc) {
        this.remove(doc);
        for (let pathDef of this.pathsDefinitions) {
            this.build(doc, pathDef);
        }
    }

    public get(path, matchTerm): any {

        if (!this.hasIndex(path)) {
            console.warn("ignoring unknown constraint '"+path+"'");
            return undefined;
        }

        const result = this.index[path][matchTerm];
        if (result) {
            return Object.keys(result).map(id => new Object({id:id, date: this.dates[id]}));
        } else {
            return [];
        }
    }

    private hasIndex(path) {
        for (let pd of this.pathsDefinitions) {
            if (pd.path == path) return true;
        }
        return false;
    }

    private addToIndex(doc, path, target) {
        if (!this.index[path][target]) this.index[path][target] = {};
        this.index[path][target][doc.resource.id] = true;
    }

    private setUp() {
        this.index = { };
        this.dates = { };
        for (let pathDefinition of this.pathsDefinitions) {
            this.index[pathDefinition.path] = { };
        }
    }

    private static getElForPathIn(doc, path) {
        let result = doc;
        for (let segment of path.split('.')) {
            if (result[segment]) result = result[segment];
            else result = undefined;
        }
        return result;
    }

    private static getLastModified(doc) {
        if (doc.modified && doc.modified.length > 0) {
            return doc.modified[doc.modified.length - 1].date;
        } else return doc.created.date;
    }
}