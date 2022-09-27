import { Query } from '../../api/query';
import { Result, ResultDocument } from '../../api/result';
import { Document } from '../../api/document';
import { get, getPredecessors, search, searchMap } from '../../api/documents';


export type ProjectData = {
    searchResult: Result,
    mapSearchResult: Result,
    selected: Document,
    predecessors: ResultDocument[]
};


export const fetchProjectData = async (token: string, query?: Query, selectedId?: string,
        predecessorsId?: string): Promise<ProjectData> => {

    const promises = [];
    promises.push(query ? search(query, token) : undefined);
    promises.push(query ? searchMap(query, token) : undefined);
    promises.push(selectedId ? get(selectedId, token) : undefined);
    promises.push(predecessorsId ? getPredecessors(predecessorsId, token) : { results: [] });

    const data = await Promise.all(promises);
    return {
        searchResult: data[0],
        mapSearchResult: data[1],
        selected: data[2],
        predecessors: data[3].results
    };
};
