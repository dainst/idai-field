/**
 * @author Daniel de Oliveira
 */
export class ListUtil {

    /**
     * Generate a new list with elements which are contained in l but not in r
     */
    public static subtract(l: any[], r: any[]): any[] {

        return l.filter(item => r.indexOf(item) === -1);
    }


    public static add(list: any[], item: any): any[] {

        return (list.indexOf(item) > -1) ? list : list.concat([item]);
    }


    public static remove(list: any[], item: any): any[] {

        return list.filter(itm => itm != item);
    }


    public static subtractTwo(sets: Array<Array<any>>, other: Array<any>): Array<any> {

        const result = JSON.parse(JSON.stringify(other));

        sets.forEach(set =>
            set.map(object =>
                result.indexOf(object))
                .filter(i => i > -1)
                .reverse()
                .forEach(i => result.splice(i, 1))
        );

        return result;
    }


    public static intersect(a: Array<Array<any>>): Array<any> {

        return a.reduce((p, c) =>
            p.filter(e =>
                c.map(r => r).indexOf(e) !=- 1
            )
        );
    }


    public static union(sets: Array<Array<any>>) {

        return Object.keys(sets.reduce((result: any, set) => {
            set.forEach(item => result[item] = item);
            return result;
        }, {}));
    }
}