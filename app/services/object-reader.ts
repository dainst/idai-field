import {Injectable} from "angular2/core";
import {Observable} from "rxjs/Observable";

/**
 * @author Sebastian Cuy
 */
@Injectable()
export class ObjectReader {
    
    static CHUNK_SIZE = 1000;

    public fromFile(file: File): Observable<any> {

        return Observable.create( observer => {

            var start = 0;
            var end = ObjectReader.CHUNK_SIZE;
            var buf = "";
            var loaded = 0;

            while (start <= file.size) {
                var chunk = file.slice(start, end);
                var reader = new FileReader();
                reader.onload = (event: any) => {
                    buf += event.target.result;
                    var nlPos = buf.indexOf('\n');
                    while (nlPos != -1) {
                        var object = JSON.parse(buf.substr(0, nlPos));
                        observer.next(object);
                        buf = buf.substr(nlPos+1);
                        nlPos = buf.indexOf('\n');
                    }
                    loaded += event.target.result.length;
                    if (loaded >= file.size) observer.complete();
                }
                reader.readAsText(chunk);
                start += ObjectReader.CHUNK_SIZE;
                end += ObjectReader.CHUNK_SIZE;
            }
            
        });

    }

}