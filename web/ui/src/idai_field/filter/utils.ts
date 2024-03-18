import { addFilterToParams, deleteFilterFromParams } from '../../api/query';


export const buildParamsForFilterValue = (params: URLSearchParams, key: string, value: string): URLSearchParams =>
    isFilterValueInParams(params, key, value)
        ? deleteFilterFromParams(params, key, value)
        : addFilterToParams(params, key, value);

export const isFilterValueInParams = (params: URLSearchParams, key: string, value: string): boolean =>
    params.has(key) && params.getAll(key).includes(value);
