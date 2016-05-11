import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";

/**
 * @author Sebastian Cuy
 */
@Injectable()
export class ObjectReader {

    constructor(private chunkSize: number = 1000) {}

    public fromFile(file: File): Observable<any> {

        return Observable.create( observer => {

            var start = 0;
            var end = this.chunkSize;
            var buf = "";
            var loaded = 0;
            var line = 1;

            while (start <= file.size) {
                var chunk = file.slice(start, end);
                var reader = new FileReader();
                reader.onload = (event: any) => {
                    buf += event.target.result;
                    var nlPos = buf.indexOf('\n');
                    while (nlPos != -1) {
                        try {
                            var object = JSON.parse(buf.substr(0, nlPos));
                            observer.next(object);
                        } catch(e) {
                            observer.error({ line: line, cause: e});
                        }
                        buf = buf.substr(nlPos+1);
                        nlPos = buf.indexOf('\n');
                        line++;
                    }
                    loaded += event.target.result.length;
                    if (loaded >= file.size) {
                        if (buf.length > 0) {
                            var object = JSON.parse(buf);
                            observer.next(object);
                        }
                        observer.complete();
                    }
                }
                reader.readAsText(chunk);
                start += this.chunkSize;
                end += this.chunkSize;
            }
            
        });

    }

}