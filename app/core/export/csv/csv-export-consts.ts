import {left, Pair, right} from 'tsfun';

export const H = left;
export const M = right;
export type Cell = string;
export type Matrix = Cell[][];
export type Heading = string;
export type Headings = Heading[];
export type HeadingsAndMatrix = Pair<Headings, Matrix>;


export module CsvExportConsts {

    export const OBJECT_SEPARATOR = '.';
}
