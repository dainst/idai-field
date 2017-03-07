import {M} from "../m";

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 */
export class JsonlParser  {

    protected static parseContent(content,observer,makeDocFun) {

        let lines = content.split('\n');
        let len = lines.length;

        for (let i = 0; i < len; i++) {

            try {

                if (lines[i].length > 0) observer.next(makeDocFun(lines[i]))

            } catch (e) {
                observer.error([M.IMPORTER_FAILURE_INVALIDJSON,i+1]);
            }
        }
    }
}