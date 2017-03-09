import {Injectable} from "@angular/core";
import {Parser} from "./parser";
import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class AbstractParser implements Parser {

    protected warnings: string[][]; // array of msgWithParams

    abstract parse(content: string): Observable<Document>;

    public getWarnings(): string[][] {
        return this.warnings;
    }

    protected addToWarnings(keyOfM) {

        for (let msgWithParams of this.warnings) {
            if (msgWithParams[0] == keyOfM) return;
        }

        this.warnings.push([keyOfM])
    }
}