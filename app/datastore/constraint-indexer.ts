import {ObjectUtil} from "../util/object-util";
import {ModelUtil} from "../model/model-util";
/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndexer {

    private index: {
        [path: string]: {
            [resourceId: string]:
                { [resourceId: string] :
                    string // date
                }
        }};

    constructor(private pathsDefinitions) {
        this.setUp();
    }

    public clear() {
        this.setUp();
    }

    public put(doc, skipRemoval = false) {
        if (!skipRemoval) this.remove(doc);
        for (let pathDef of this.pathsDefinitions) {
            this.putFor(pathDef, doc);
        }
    }

    public remove(doc) {
        for (let pathDef of this.pathsDefinitions) {
            for (let key of Object.keys(this.index[pathDef.path])) {
                if (this.index[pathDef.path][key][doc.resource.id]) {
                    delete this.index[pathDef.path][key][doc.resource.id];
                }
            }
        }
    }

    public get(path, matchTerm): any {

        if (!this.hasIndex(path)) {
            console.warn("ignoring unknown constraint '"+path+"'");
            return undefined;
        }

        const result = this.index[path][matchTerm];
        if (result) {
            return Object.keys(result).map(id => new Object({id: id, date: result[id]}));
        } else {
            return [];
        }
    }

    private putFor(pathDef, doc) {

        const elForPath = ObjectUtil.getElForPathIn(doc, pathDef.path);

        if (!elForPath) {
            return this.addToIndex(doc, pathDef.path, 'UNKOWN');
        }

        if (pathDef.string) {
            this.addToIndex(doc, pathDef.path, elForPath);
        } else {
            for (let target of elForPath) {
                this.addToIndex(doc, pathDef.path, target);
            }
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
        this.index[path][target][doc.resource.id] = ModelUtil.getLastModified(doc);
    }

    private setUp() {
        this.index = { };
        for (let pathDefinition of this.pathsDefinitions) {
            this.index[pathDefinition.path] = { };
        }
    }
}