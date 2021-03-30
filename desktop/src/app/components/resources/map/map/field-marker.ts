import {FieldDocument} from 'idai-field-core';

export interface FieldMarker extends L.CircleMarker {

    document?: FieldDocument;
}
