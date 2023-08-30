import { Field, Subfield, Valuelist } from 'idai-field-core';

export type DifferingFieldType = 'field'|'relation'|'geometry'|'georeference';


export interface DifferingField {

    name: string;
    type: DifferingFieldType;
    label: string;
    inputType?: Field.InputType;
    valuelist?: Valuelist;
    subfields?: Array<Subfield>;
    rightSideWinning: boolean;
}
