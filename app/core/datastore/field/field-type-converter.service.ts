import {Injectable} from '@angular/core';
import {Document, ImageDocument} from 'idai-components-2';
import {compose, getOnOr, setOn} from 'tsfun';
import {TypeConverter} from '../core/type-converter';
import {TypeUtility} from '../../model/type-utility';
import {FieldnameMigrator} from './fieldname-migrator';


const takeOrMake = (path: string, alternative: any) => <T>(o: T) => compose(getOnOr(path , alternative), setOn(o, path))(o);

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class FieldTypeConverter extends TypeConverter<Document> {


    constructor(private typeUtility: TypeUtility) {

        super();
    }


    public assertTypeToBeOfClass(type: string, typeClass: string): void {

        if (typeClass === 'ImageDocument') {

            if (!this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must be ImageDocument';

        } else if (typeClass === 'FeatureDocument') {

            if (!this.typeUtility.isSubtype(type, 'Feature')) throw 'Wrong type class: must be FeatureDocument';

        } else if (typeClass === 'FieldDocument') {

            if (this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must not be ImageDocument';
            // feature docs are allowed to also be idai field documents
        }
    }


    public getTypesForClass(typeClass: string): string[]|undefined {

        if (typeClass === 'ImageDocument') {

            return this.typeUtility.getImageTypeNames();

        } else if (typeClass === 'FeatureDocument') {

            return this.typeUtility.getFeatureTypeNames();

        } else if (typeClass === 'FieldDocument') {

            return this.typeUtility.getNonImageTypeNames();
        }
    }


    public convert<T extends Document>(document: Document): T {

        if (this.typeUtility.isSubtype(document.resource.type, 'Image')) {
            takeOrMake('resource.identifier','')(document);
            takeOrMake('resource.relations.depicts', [])(document);
        } else {
            takeOrMake('resource.identifier','')(document);
            takeOrMake('resource.relations.isRecordedIn', [])(document);

            if (this.typeUtility.isSubtype(document.resource.type,'Feature')) {
                takeOrMake('resource.relations.isContemporaryWith', [])(document);
                takeOrMake('resource.relations.isAfter', [])(document);
                takeOrMake('resource.relations.isBefore', [])(document);
            }
        }

        return FieldnameMigrator.migrate(document) as T;
    }
}