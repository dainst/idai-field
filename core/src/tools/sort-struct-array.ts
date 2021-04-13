import {is, on, copy, separate, Path, Mapping} from 'tsfun';


export function sortStructArray<Struct>(order: string[], path: Path): Mapping<Array<Struct>> {

    return items => {

        let source = copy(items);
        let sorted = [];

        for (let name of order) {
            const [match, rest] = separate(on(path, is(name)), source);
            sorted = sorted.concat(match);
            source = rest;
        }

        return sorted.concat(source);
    }
}
