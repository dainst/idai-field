import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {IdaiFieldDocument} from "../model/idai-field-document";

export interface ObjectReaderError extends SyntaxError {
    lineNumber: number;
    fileName: String;
}

/**
 * Reads objects from a file.
 * Expects a UTF-8 encoded text file with one JSON-Object per line.
 *
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
@Injectable()
export class ObjectReader {

    /**
     * Read objects from file
     *
     * @param file the file to be read
     * @returns {Observable<IdaiFieldDocument>} An observable that emits
     *   objects for every parsed line or an error of type ObjectReaderError
     *   if an error is encountered while parsing.
     */
    public read(file: File): Observable<IdaiFieldDocument> {

        return Observable.create(observer => {

            let reader = new FileReader();

            reader.onload = (event: any) => {

                var lines = event.target.result.split('\n');
                var len = lines.length;

                for (var i = 0; i < len; i++) {

                    try {
                        observer.next(this.makeDoc(JSON.parse(lines[i])));
                    } catch(e) {
                        let error: ObjectReaderError = e;
                        error.lineNumber = i + 1;
                        error.fileName = file.name;
                        observer.error(error);
                    }
                }
                observer.complete();
            };

            reader.onerror = (event: any) => {
                observer.error(event.target.error);
            };

            reader.readAsText(file);
        });
    }

    private makeDoc(resource){
        resource['@id']=resource['id'];
        delete resource['id'];
        resource['type']=resource['@id'].replace(/\/[^/]*$/,"").replace(/\//,"");
        return {
            "resource":resource,
            "id": resource['@id'].replace(/\/.*\//,"")
        };
    }
}