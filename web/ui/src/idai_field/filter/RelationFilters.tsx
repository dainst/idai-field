import React, { ReactElement } from 'react';
import { ProjectView } from '../project/Project';
import RelationFilter from './RelationFilter';


const FILTER_RELATIONS = ['isInstanceOf'];


export default function RelationFilters({ searchParams, projectId, projectView }
        : { searchParams: URLSearchParams, projectId: string, projectView: ProjectView }): ReactElement {

    return <>
        {
            FILTER_RELATIONS
                .filter(relationName => hasRelationFilter(searchParams, relationName))
                .map(relationName => <RelationFilter key={ relationName }
                                                     relationName={ relationName }
                                                     resourceId={ getResourceId(searchParams, relationName) }
                                                     params={ searchParams }
                                                     projectId={ projectId }
                                                     projectView={ projectView } />)
        }
    </>;
}


const hasRelationFilter = (params: URLSearchParams, relationName: string): boolean => {

    return params.has(`resource.relations.${relationName}.resource.id`);
};


const getResourceId = (params: URLSearchParams, relationName: string): string => {

    return params.get(`resource.relations.${relationName}.resource.id`);
};
