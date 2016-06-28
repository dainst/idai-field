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
 */
@Injectable()
export class ObjectReader {

    /**
     * Create ObjectReader
     *
     * @param chunkSize sets the number of characters that are read in
     *   one chunk (default: 1000)
     */
    constructor() {
        // TODO: injection of chunkSize doesn't work
    }

    private chunkSize: number = 1000

    /**
     * Read objects from file
     *
     * @param file the file to be read
     * @returns {Observable<IdaiFieldDocument>} An observable that emits
     *   objects for every parsed line or an error of type ObjectReaderError
     *   if an error is encountered while parsing.
     */
    public fromFile(file: File): Observable<IdaiFieldDocument> {

        return Observable.create( observer => {

            var start = 0;
            var end = this.chunkSize;
            var buf = "";
            var loaded = 0;
            var line = 1;

            while (start <= file.size) {
                let chunk = file.slice(start, end);
                let reader = new FileReader();
                reader.onload = (event: any) => {
                    buf += event.target.result;
                    let nlPos = buf.indexOf('\n');
                    while (nlPos != -1) {
                        try {
                            let object = JSON.parse(buf.substr(0, nlPos));
                            observer.next(object);
                        } catch(e) {
                            let error: ObjectReaderError = e;
                            error.lineNumber = line;
                            error.fileName = file.name;
                            observer.error(error);
                        }
                        buf = buf.substr(nlPos+1);
                        nlPos = buf.indexOf('\n');
                        line++;
                    }
                    loaded += event.target.result.length;
                    if (loaded >= file.size) {
                        if (buf.length > 0) {
                            try {
                                let object = JSON.parse(buf);
                                observer.next(object);
                            } catch(e) {
                                let error: ObjectReaderError = e;
                                error.lineNumber = line;
                                error.fileName = file.name;
                                observer.error(error);
                            }
                        }
                        observer.complete();
                    }
                };
                reader.readAsText(chunk);
                start += this.chunkSize;
                end += this.chunkSize;
            }
        });
    }
}