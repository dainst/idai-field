import {TypeConverter} from "./core/type-converter";
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ImageTypeUtility} from '../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Injectable} from "@angular/core";
import {ObjectUtil} from '../../util/object-util';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldTypeConverter extends TypeConverter {

    constructor(private imageTypeUtility: ImageTypeUtility) {

        super();
    }


    public validate(types: string[]|undefined, typeClass: string): string[]|undefined {

        if (types) return types.map(type => this.proveIsCorrectType(type, typeClass));

        if (typeClass == 'IdaiFieldImageDocument') {
            return this.imageTypeUtility.getImageTypeNames()
        } else if (typeClass == 'IdaiFieldDocument') {
            return this.imageTypeUtility.getNonImageTypeNames();
        }

    }


    public convert<T extends Document>(doc: Document): T {

        // TODO do not do anything for document, use typeClass
        if (this.imageTypeUtility.isImageType(doc.resource.type)) {
            ObjectUtil.takeOrMake(doc,'resource.identifier','');
            ObjectUtil.takeOrMake(doc,'resource.relations.depicts', []);
        } else {
            ObjectUtil.takeOrMake(doc,'resource.identifier','');
            ObjectUtil.takeOrMake(doc,'resource.relations.isRecordedIn', []);
        }

        return doc as T;
    }


    private proveIsCorrectType(type: string, typeClass: string): string {

        if (typeClass == 'IdaiFieldImageDocument') {
            if (!this.imageTypeUtility.isImageType(type)) throw "Wrong type class: must be IdaiFieldImageDocument";
        } else if (typeClass == 'IdaiFieldDocument') {
            if (this.imageTypeUtility.isImageType(type)) throw "Wrong type class: must not be IdaiFieldImageDocument";
        }
        return type;
    }
}