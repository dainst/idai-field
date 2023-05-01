import * as tf from '@tensorflow/tfjs';
import { RESNET_MODEL_PATH, SEG_MODEL_PATH } from '../idai_shapes/constants';
import { predict } from './featurevectors/resnet';
import { segmentImage } from './featurevectors/segmentation';

export type Query = {
    q?: string,
    filters?: Filter[],
    not?: Filter[],
    exists?: string[],
    parent?: string,
    size?: number,
    from?: number,
    sort?: string,
    image_query?: ImageQuery
};


export type Filter = {
    field: string,
    value: string
};


export type ImageQuery = {
    model: 'resnet' | 'phaseFourier',
    segment_image: boolean,
    image: tf.Tensor3D,
};


export type BackendParams = {
    q?: string,
    size?: number,
    from?: number,
    filters?: string[],
    not?: string[],
    exists?: string[],
    not_exists?: string[],
    sort?: string[],
    vector_query?: VectorQuery
};


export type VectorQuery = {
    model: string,
    query_vector: number[]
};


export const buildBackendPostParams = async (query: Query): Promise<BackendParams> => {

    const params: BackendParams = {
        q: query.q && query.q.length > 0 ? query.q : '*',
        filters: [],
        not: [],
        exists: [],
        not_exists: []
    };

    if (query.filters) {
        params.filters.push(...query.filters.map((filter: Filter) => `${filter.field}:${getFilterValue(filter)}`));
    }
    if (query.not) {
        params.not.push(...query.not.map((filter: Filter) => `${filter.field}:${getFilterValue(filter)}`));
    }
    if (query.exists) {
        params.exists.push(...query.exists.map((fieldName: string) => `${fieldName}`));
    }
    
    if (query.parent && query.parent !== 'root') {
        params.filters.push(`resource.relations.isChildOf.resource.id:${query.parent}`);
    } else if (query.parent === 'root') {
        params.not_exists.push('resource.relations.isChildOf');
    }

    if (query.size) params.size = query.size;
    if (query.from) params.from = query.from;
    if (query.sort) params.sort = [query.sort];
    if (query.image_query) params.vector_query = await buildVectorQuery(query.image_query);

    return params;
};


export const buildProjectsOverviewQueryTemplate = (from: number, size: number, excludedTypes: string[]): Query => ({
    size,
    from,
    not: excludedTypes.map(type => ({ field: 'resource.category.name', value: type }))
});


export const buildProjectQueryTemplate = (id: string, from: number, size: number, excludedTypes: string[]): Query => ({
    size,
    from,
    filters: [
        { field: 'project', value: id }
    ],
    not: excludedTypes.map(type => ({ field: 'resource.category.name', value: type }))
});


export const parseFrontendGetParams = (params: URLSearchParams, query: Query = { filters: [] }): Query => {

    const newQuery = JSON.parse(JSON.stringify(query));

    if (params.has('q')) {
        newQuery.q = params.get('q');
    } else if (!params.has('parent')) {
        newQuery.q = '*';
    }

    if (params.has('parent')) {
        newQuery.parent = params.get('parent');
        newQuery.sort = 'sort';
    }

    const filters = Array.from(params.entries())
        .filter(([field]) => field !== 'q' && field !== 'r' && field !== 'parent' && field !== 'sort')
        .map(([field, value]) => ({ field: field.replace(':', '%3A'), value }));
    
    if (!newQuery.filters) newQuery.filters = [];
    newQuery.filters = newQuery.filters.concat(filters);

    return newQuery;
};


export const addFilterToParams = (params: URLSearchParams, key: string, value: string): URLSearchParams => {

    const newParams = new URLSearchParams(params);
    newParams.append(key, value);
    return newParams;
};


export const deleteFilterFromParams = (params: URLSearchParams, key: string, value?: string): URLSearchParams => {

    const newParams = new URLSearchParams(params);
    if (value) {
        const newValues = params.getAll(key).filter(v => v !== value);
        newParams.delete(key);
        newValues.forEach(v => newParams.append(key, v));
    } else newParams.delete(key);
    return newParams;
};


const buildVectorQuery = async (imageQuery: ImageQuery): Promise<VectorQuery> => {

    let resnetInputImage: tf.Tensor3D;
    await tf.ready();
    if (imageQuery.segment_image) {
        const model = await tf.loadLayersModel(SEG_MODEL_PATH);
        resnetInputImage = await segmentImage(imageQuery.image, model);
    }
    else {
        resnetInputImage = imageQuery.image;
    }
    const resnet = await tf.loadLayersModel(RESNET_MODEL_PATH);
    const query_vector = await predict(resnetInputImage, resnet);
    
    return {
        query_vector,
        model: imageQuery.model
    };
};


const getFilterValue = (filter: Filter): string => {

    return filter.value.replace(':', '%3A');
};
