import {left, Pair, right} from 'tsfun';

export const H = left;
export const M = right;
export type Cell = string;
export type Row = Cell[];
export type Matrix = Row[];
export type Heading = string;
export type Headings = Heading[];
export type HeadingsAndMatrix = Pair<Headings, Matrix>;


export module CsvExportConsts {

    export const OBJECT_SEPARATOR = '.';
    export const ARRAY_SEPARATOR = ';';

    export const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
    export const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
    export const RELATIONS_LIES_WITHIN = 'relations.liesWithin';
}
