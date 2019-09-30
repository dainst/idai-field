import {ObjectCollection, reduce, dissoc, assoc} from 'tsfun';
import {getOn} from 'tsfun/src/objectstruct';


// @author: Daniel de Oliveira


export const makeLookup = (path: string) => {

    return <A>(as: Array<A>): ObjectCollection<A> => {

        return reduce((amap: {[_:string]: A}, a: A) => {

            amap[getOn(a)(path)] = a;
            return amap;

        }, {})(as);
    }
};


export function len<A>(as: Array<A>) {

    return as.length;
}


export function gt(o: number) { return (a: number) => a > o; }


export function dissocReducer(struct: any, path: string) {

   return dissoc(path)(struct);
}


export function assocReducer(f: (_: string) => any) {

    return (struct: any, path: string) => {

        return assoc(path, f(path))(struct);
    }
}
