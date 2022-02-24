import { Document } from './document';
import { buildBackendPostParams, Query } from './query';
import { PredecessorResult, Result, ResultDocument } from './result';
import { getHeaders } from './utils';


export const get = async (id: string, token: string): Promise<Document> => {

    const response = await fetch(`/api/documents/${id}`, { headers: getHeaders(token) });
    if (response.ok) return await response.json();
    else throw(response);
};

export const search = async (query: Query, token: string): Promise<Result> =>
    fetchPost('/api/documents', query, token);

export const search_after = async (query: Query, token: string): Promise<Result> =>
    fetchPost('/api/documents/searchafter', query, token);


export const searchMap = async (query: Query, token: string): Promise<Result> =>
    fetchPost('/api/documents/map', query, token);


export const getPredecessors = async (id: string, token: string): Promise<PredecessorResult> => {
    
    const uri = `/api/documents/predecessors/${id}`;
    const response = await fetch(uri, { headers: getHeaders(token) });
    if (response.ok) return await response.json();
    else throw(await response.json());
};


export const getSimilar = async (id: string, token: string,
    featureType: string = 'phaseFourier',size: number = 60): Promise<Result> => {
    
    const uri = `/api/documents/similar/${featureType}/${id}?size=${size}`;
    const response = await fetch(uri, { headers: getHeaders(token) });
    console.log(response);
    if (response.ok) return await response.json();
    else throw(await response.json());
};


const fetchPost = async (uri: string, query: Query, token: string): Promise<Result> => {
    const headers = getHeaders(token);
    headers['Content-Type'] = 'application/json';
    const params = await buildBackendPostParams(query);
    const response = await fetch(uri, { headers, method: 'POST', body: JSON.stringify(params) });
    console.log(JSON.stringify(params));
    return response.json();
};