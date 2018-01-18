export type NestedArray<T> = Array<Array<T>>;

/**
 * @author Daniel de Oliveira
 */


/**
 * Generate a new list with elements which are contained in l but not in r
 */
export const subtract = (l: any[], r: any[]): any[] => {

    return l.filter(item => r.indexOf(item) === -1);
};


export const add = (list: any[], item: any): any[] => {

    return (list.indexOf(item) > -1) ? list : list.concat([item]);
};


export const remove = (list: any[], item: any): any[] => {

    return list.filter(itm => itm != item);
};


export const subtractTwo = (sets: NestedArray<any>, other: Array<any>): Array<any> => {

    const result = JSON.parse(JSON.stringify(other));

    sets.forEach(set =>
        set.map(object =>
            result.indexOf(object))
            .filter(i => i > -1)
            .reverse()
            .forEach(i => result.splice(i, 1))
    );

    return result;
};


export const intersect = (a: NestedArray<any>): Array<any> => {

    return a.reduce((p, c) =>
        p.filter(e =>
            c.map(r => r).indexOf(e) !=- 1
        )
    );
};


export const union = (sets: NestedArray<any>) => {

    return Object.keys(sets.reduce((result: any, set) => {
        set.forEach(item => result[item] = item);
        return result;
    }, {}));
};
