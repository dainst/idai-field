import {Document} from '../model/document';


export abstract class Converter {

    public abstract convert(document: Document): Document;
}
