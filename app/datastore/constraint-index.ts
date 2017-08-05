/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndex {

    private index = undefined;
    private dates = {}; // map: resourceId => date

    constructor(private pathsDefinitions) {
        this.setUp();
    }

    public clear() {
        this.setUp();
    }

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
        }

    }

    // TODO factor out duplicate code with setDocs
    // TODO remove also from dates
    public remove(doc) {
        for (let pathDef of this.pathsDefinitions) {
            for (let key of Object.keys(this.index[pathDef.path])) {
                if (this.index[pathDef.path][key].indexOf(doc.resource.id) != -1) {
                    // TODO there should be only one occurence of the id to remove
                    this.index[pathDef.path][key].splice(this.index[pathDef.path][key].indexOf(doc.resource.id), 1);
                }
            }
        }
    }

    public update(doc) {
        this.remove(doc);
        for (let pathDef of this.pathsDefinitions) {
            this.build(doc, pathDef);
        }
    }

    // TODO get method which executes multiple constraints at the same time, taking query.constraints, returning resultsets struct, or undefined if no usable constraint

    public get(path, matchTerm): string[] {
        if (!this.hasIndex(path)) throw "an index for '"+path+"' does not exist";

        if (this.index[path][matchTerm]) {
            return this.index[path][matchTerm].map(id => new Object({id:id, date: this.dates[id]}));
        } else return [];
    }

    public hasIndex(path) {
        for (let pd of this.pathsDefinitions) {
            if (pd.path == path) return true;
        }
        return false;
    }

    private addToIndex(doc, path, target) { // TODO prevent adding a doc more than once
        if (!this.index[path][target]) {
            this.index[path][target] = [doc.resource.id]; // TODO this can be done with maps, e.g. [target][doc.resource.id] = true, in order to raise performance
        } else {
            this.index[path][target].push(doc.resource.id);
        }
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