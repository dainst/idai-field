/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndex {

    private index = { };

    public setDocs(docs) {
        for (let doc of docs) {
            if (!this.index[doc.resource.relations.isRecordedIn[0]]) {
                this.index[doc.resource.relations.isRecordedIn[0]] = [doc.resource.id];
            } else {
                this.index[doc.resource.relations.isRecordedIn[0]].push(doc.resource.id);
            }
        }
    }

    public get(matchTerm): string[] {
        return this.index[matchTerm];
    }
}