import {M} from "../m";
import {AbstractParser} from "./abstract-parser";

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 */
export abstract class AbstractJsonlParser extends AbstractParser {

    protected static parseContent(content,observer,makeDocFun) {

        let lines = content.split('\n');
        let len = lines.length;

        for (let i = 0; i < len; i++) {

            try {

                if (lines[i].length > 0) observer.next(makeDocFun(lines[i]))

            } catch (e) {
                console.error('parse content error. reason: ',e);
                observer.error([M.IMPORTER_FAILURE_INVALIDJSON,i+1]);
            }
        }
    }
}