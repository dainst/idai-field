import { Geometry } from 'geojson';
import { isObject, to } from 'tsfun';
import { Dating, Dimension, Literature, OptionalRange, I18N, Field as FieldDefinition } from 'idai-field-core';
import { getLabel } from '../shared/languages';
import { ResultDocument } from './result';


export interface Document {
    created: ChangeEvent;
    modified: ChangeEvent[];
    project: string;
    resource: Resource;
}


export interface ChangeEvent {
    user: string;
    date: string;
}


export interface Resource {
    category: LabeledValue;
    id: string;
    identifier: I18N.String;
    shortDescription: I18N.String;
    shortName?: I18N.String;
    groups: FieldGroup[];
    geometry: Geometry;
    childrenCount: number;
    parentId: string;
    grandparentId: string;
    license?: string;
    relations?: { [relationName: string]: ResultDocument[] };
}


export interface FieldGroup {
    name: string;
    fields: Field[];
}


export interface DimensionWithLabeledMeasurementPosition extends Omit<Dimension, 'measurementPosition'> {
    measurementPosition?: LabeledValue;
}


export function convertMeasurementPosition(dimension: Dimension): Dimension {
    
    if (!isObject(dimension)) return dimension;

    const clone: Dimension = JSON.parse(JSON.stringify(dimension));
    clone[Dimension.MEASUREMENTPOSITION] = isLabeledValue(dimension) ? getLabel(dimension) : undefined;

    return clone;
}


export type FieldValue =
    string
    | LabeledValue
    | boolean
    | Dimension
    | DimensionWithLabeledMeasurementPosition
    | Dating
    | Literature
    | OptionalRange<LabeledValue>
    | FieldValue[];


export interface Field {
    description: I18nString;
    label: I18nString;
    name: string;
    inputType: FieldDefinition.InputType;
    value?: FieldValue;
    targets?: ResultDocument[];
}


export type I18nString = { [languageCode: string]: string };


export interface Labeled { // TODO review duplication with idai-field (Labelled)
    label: string;
}


export function isLabeled(labeled: unknown): labeled is Labeled {

    return isObject(labeled) && labeled['label'];
}


export interface LabeledValue {
    name: string;
    label: I18nString;
}


export function isLabeledValue(labeledValue: unknown): labeledValue is LabeledValue {

    return isObject(labeledValue) && labeledValue['label'] && labeledValue['name'];
}


export function getFieldValue(document: Document, fieldName: string): FieldValue|undefined {
    
    const group: FieldGroup = document.resource.groups.find(g => g.fields.map(to('name')).includes(fieldName));

    return group
        ? group.fields.find((field: Field) => field.name === fieldName)?.value
        : undefined;
}


export function getDocumentImages(document: Document): ResultDocument[]|undefined {
    
    const group: FieldGroup = document.resource.groups
        .find(group => group.fields.map(to('name')).includes('isDepictedIn'));

    return group
        ? group.fields.find((rel: Field) => rel.name === 'isDepictedIn')?.targets
        : undefined as undefined;
}
