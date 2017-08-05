/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndex {

    private index = { };

    public setDocs(docs) {
        for (let doc of docs) {
            for (let target of doc.resource.relations.isRecordedIn) {

                if (!this.index[target]) {
                    this.index[target] = [doc.resource.id];
                } else {
                    this.index[target].push(doc.resource.id);
                }
            }
        }
    }

    public get(matchTerm): string[] {
        return this.index[matchTerm];
    }
}