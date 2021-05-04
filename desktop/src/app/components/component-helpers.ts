import {Predicate} from 'tsfun';

type DomElement = any;

export namespace ComponentHelpers {

    export function isInside(target: DomElement, test: Predicate<DomElement>) {
        // TODO review duplication with sidebar-list.component#handleClick
        let inside = false;
        do {
            if (test(target)) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);
        return inside;
    }
}
