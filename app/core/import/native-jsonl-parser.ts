import {Observable} from 'rxjs/Observable';
import {NewDocument} from 'idai-components-2';
import {M} from '../../m';
import {AbstractParser} from './abstract-parser';
import {Observer} from 'rxjs/Observer';

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends AbstractParser {


    public parse(content: string): Observable<NewDocument> {
        
        this.warnings = [];
        return Observable.create((observer: Observer<NewDocument>) => {
            NativeJsonlParser.parseContent(content, observer);
            observer.complete();
        });
    }


    private static parseContent(content: string, observer: Observer<NewDocument>) {

        const lines = content.split('\n');
        const len = lines.length;

        for (let i = 0; i < len; i++) {

            try {
                if (lines[i].length > 0) observer.next(NativeJsonlParser.makeDoc(lines[i]));
            } catch (e) {
                console.error('parse content error. reason: ', e);
                observer.error([M.IMPORT_FAILURE_INVALIDJSONL, i + 1]);
                break;
            }
        }
    }


    private static makeDoc(line: string): NewDocument {

        const resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};

        return { resource: resource };
    }
}