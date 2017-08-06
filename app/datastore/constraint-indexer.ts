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

    // TODO maybe we only need the update method
    public setDocs(docs) {
        for (let pathDef of this.pathsDefinitions) {
            for (let doc of docs) {
                this.build(doc, pathDef)
            }
        }
    }

    private build(doc, pathDef) {

        let lastModified = doc.created.date;
        if (doc.modified && doc.modified.length > 0)
            lastModified = doc.modified[doc.modified.length - 1].date;

        this.dates[doc.resource.id] = lastModified;



        if (this.getElForPathIn(doc, pathDef.path)) {

            if (pathDef.string) {
                this.addToIndex(doc, pathDef.path,
                    this.getElForPathIn(doc, pathDef.path));
            } else {
                for (let target of this.getElForPathIn(doc, pathDef.path)) {
                    this.addToIndex(doc, pathDef.path, target);
                }
            }
        } else {
            this.addToIndex(doc, pathDef.path, 'UNKOWN');
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

        if (this.index[path][matchTerm]) {
            return Object.keys(this.index[path][matchTerm]).map(id => new Object({id:id, date: this.dates[id]}));
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

    private getElForPathIn(doc, path) {
        let result = doc;
        for (let segment of path.split('.')) {
            if (result[segment]) result = result[segment];
            else result = undefined;
        }
        return result;
    }
}