import { Geometry } from 'geojson';
import { ImageGeoreference, Literature, Dating, Dimension } from 'idai-field-core';
import { ChangeEvent, I18nString, LabeledValue } from './document';


export interface ScrollState {
    atBottom: boolean;
    atTop: boolean;

}

export interface MinMaxSort {
    min: string;
    max: string;

}
export interface Result {
    size: number;
    documents: ResultDocument[];
    filters: ResultFilter[];
}


export interface ResultDocument {
    sort?: string;
    created: ChangeEvent;
    modified: ChangeEvent[];
    project: string;
    resource: ResultResource;
    deleted?: boolean;
}


export interface ResultResource {
    category: LabeledValue;
    id: string;
    identifier: string;
    shortDescription: string;
    shortName?: string;
    childrenCount: number;
    parentId: string;
    grandparentId: string;
    literature: Literature;
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


export interface FilterBucket {
    value: LabeledValue;
    count: number;
}


export interface FilterBucketTreeNode {
    item: FilterBucket;
    trees: FilterBucketTreeNode[];
}

export interface PredecessorResult {
    results: ResultDocument[];
}