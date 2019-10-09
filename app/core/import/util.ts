import {ObjectCollection, reduce, dissoc} from 'tsfun';
import {getOn} from 'tsfun';


// @author: Daniel de Oliveira


export const makeLookup = (path: string) => {

    return <A>(as: Array<A>): ObjectCollection<A> => {

        return reduce((amap: {[_:string]: A}, a: A) => {

            amap[getOn(a)(path)] = a;
            return amap;

        }, {})(as);
    }
};


export function withDissoc(struct: any, path: string) {

   return dissoc(path)(struct);
}