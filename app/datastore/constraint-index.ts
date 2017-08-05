/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndex {

    private index = undefined;

    constructor(private pathsDefinitions) {
        this.setUp();
    }

    public clear() {
        this.setUp();
    }

    public setDocs(docs) {
        for (let pathDef of this.pathsDefinitions) {
            for (let doc of docs) {
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
        }
    }

    // TODO factor out duplicate code with setDocs
    public remove(doc) {
        for (let pathDef of this.pathsDefinitions) {
            if (this.getElForPathIn(doc, pathDef.path)) {

                if (pathDef.string) {
                    this.removeFromIndex(doc, pathDef.path,
                        this.getElForPathIn(doc, pathDef.path));
                } else {
                    for (let target of this.getElForPathIn(doc, pathDef.path)) {
                        this.removeFromIndex(doc, pathDef.path, target);
                    }
                }
            }
        }
    }

    // TODO get method which executes multiple constraints at the same time, taking query.constraints, returning resultsets struct, or undefined if no usable constraint

    public get(path, matchTerm): string[] {
        if (!this.hasIndex(path)) throw "an index for '"+path+"' does not exist";

        if (this.index[path][matchTerm]) {
            return this.index[path][matchTerm];
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

    private removeFromIndex(doc, path, target) {
        if (!this.index[path][target]) return;

        if (this.index[path][target].indexOf(doc.resource.id) != -1) {
            this.index[path][target].splice(this.index[path][target].indexOf(doc.resource.id),1);
        }
    }

    private setUp() {
        this.index = { };
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