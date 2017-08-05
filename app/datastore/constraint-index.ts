/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndex {

    private index = { };

    constructor(private paths) {
        for (let path of paths) {
            this.index[path] = { };
        }
    }

    public setDocs(docs) {
        for (let path of this.paths) {
            for (let doc of docs) {
                if (this.getElForPathIn(doc, path)) {
                    for (let target of this.getElForPathIn(doc, path)) {
                        this.addToIndex(doc, path, target);
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