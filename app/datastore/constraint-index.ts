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

    private addToIndex(doc, path, target) {
        if (!this.index[path][target]) {
            this.index[path][target] = [doc.resource.id];
        } else {
            this.index[path][target].push(doc.resource.id);
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