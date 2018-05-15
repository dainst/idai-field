import {AbstractParser} from './abstract-parser';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {Observer} from 'rxjs/Observer';
import {M} from '../../m';

/**
 * @author Daniel de Oliveira
 */
export class MeninxFindCsvParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {

            let errorCallback = (e: any) => observer.error([M.IMPORT_FAILURE_INVALIDCSV, e.row]);

            let completeCallback = (result: any) => {
                result.errors.forEach( (e: any) => errorCallback(e) );
                result.data.forEach( (object: any, i:any) => {

                    const doc = {
                        resource: {
                            identifier: object.se + '-' + object.id,
                            shortDescription: object.description,
                            type: 'Find',
                            relations: {
                                liesWithin: [
                                    object.se
                                ]
                            }
                        }
                    };

                    observer.next(doc as any);
                });
                observer.complete();
            };

            try {
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    worker: true,
                    error: errorCallback,
                    complete: completeCallback
                });
            } catch (e) {
                observer.error([M.IMPORT_FAILURE_GENERICCSVERROR]);
            }
        });
    }
}