import { Geometry } from 'geojson';
import { isObject, to, clone } from 'tsfun';
import { Dating, Measurement, Literature, OptionalRange, I18N, Field as FieldDefinition,
    DateSpecification } from 'idai-field-core';
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
    category: CategoryValue;
    id: string;
    identifier: string;
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


export interface DimensionWithLabeledMeasurementPosition extends Omit<Measurement, 'measurementPosition'> {
    measurementPosition?: LabeledValue;
}


export function convertMeasurementSubfieldValue(measurement: Measurement,
                                                inputType: FieldDefinition.InputType): Measurement {

    const subfieldName: string = Measurement.getValuelistSubfieldName(inputType);
    
    if (!isObject(measurement) || !measurement[subfieldName]) return measurement;

    const result: Measurement = clone(measurement);
    result[subfieldName] = isLabeledValue(measurement[subfieldName])
        ? getLabel(measurement[subfieldName])
        : undefined;

    return result;
}


export type FieldValue =
    string
    | LabeledValue
    | boolean
    | DateSpecification
    | Measurement
    | DimensionWithLabeledMeasurementPosition
    | Dating
    | Literature
    | OptionalRange<LabeledValue>
    | Field[] // composite field
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


export interface CategoryValue extends LabeledValue {
    parent: string;
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
