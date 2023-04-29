import { Geometry } from 'geojson';
import { ImageGeoreference, I18N } from 'idai-field-core';
import { ChangeEvent, I18nString, LabeledValue, FieldGroup } from './document';

export interface Result {
    size: number;
    documents: ResultDocument[];
    filters: ResultFilter[];
}


export interface ResultDocument {
    created: ChangeEvent;
    modified: ChangeEvent[];
    project: string;
    resource: ResultResource;
    deleted?: boolean;
}


export interface ResultResource {
    category: LabeledValue;
    id: string;
    identifier: I18N.String;
    shortDescription: I18N.String;
    shortName?: I18N.String;
    childrenCount: number;
    parentId: string;
    grandparentId: string;
    relations?: { [relationName: string]: ResultDocument[] };
    georeference?: ImageGeoreference;
    geometry: Geometry;
    geometry_wgs84?: Geometry;
    width?: number;
    height?: number;
}


export interface ResultFilter {
    name: string;
    values: (FilterBucket | FilterBucketTreeNode)[];
    label: I18nString;
}


export interface LabeledValueWithGroups extends LabeledValue {
    groups: FieldGroup[]|null;
}


export interface FilterBucket {
    value: LabeledValueWithGroups;
    count: number;
}


export interface FilterBucketTreeNode {
    item: FilterBucket;
    trees: FilterBucketTreeNode[];
}

export interface PredecessorResult {
    results: ResultDocument[];
}