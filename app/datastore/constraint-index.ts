/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndex {

    private index = { };

    constructor(private pathsDefinitions) {
        for (let pathDefinition of pathsDefinitions) {
            this.index[pathDefinition.path] = { };
        }
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
        if (this.index[path][matchTerm]) {
            return this.index[path][matchTerm];
        } else return [];
    }

    private addToIndex(doc, path, target) {
        if (!this.index[path][target]) {
            this.index[path][target] = [doc.resource.id];
        } else {
            this.index[path][target].push(doc.resource.id);
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