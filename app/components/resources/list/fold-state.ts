export class FoldState {

    public childrenShownForIds: string[] = [];


    public clear() {

        this.childrenShownForIds = [];
    }


    public add(resourceId: string) {

        this.childrenShownForIds.push(resourceId);
    }


    public toggleChildrenForId(id: string) {

        const index = this.childrenShownForIds.indexOf(id);
        index != -1 ?
            this.childrenShownForIds.splice(index, 1) :
            this.childrenShownForIds.push(id);
    }


    public childrenHiddenFor(id: string): boolean {

        return this.childrenShownForIds.indexOf(id) == -1
    }
}