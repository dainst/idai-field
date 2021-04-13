import { Injectable } from '@angular/core';
import { takeOrMake, Converter as Converter, Document } from 'idai-field-core';
import { ProjectConfiguration } from '../../configuration/project-configuration';
import { Migrator } from './migrator';


@Injectable()
export class FieldConverter extends Converter {

    constructor(private projectConfiguration: ProjectConfiguration) { super(); }


    public convert<T extends Document>(document: Document): T {

        const convertedDocument: T = Migrator.migrate(document) as T;
        takeOrMake(convertedDocument, ['resource','identifier'], '');
        return convertedDocument;
    }
}
