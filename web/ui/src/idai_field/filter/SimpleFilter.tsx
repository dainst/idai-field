import React, { CSSProperties, ReactElement, ReactNode } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FilterBucket, ResultFilter } from '../../api/result';
import { getLabel } from '../../shared/languages';
import { ProjectView } from '../project/Project';
import CloseButton from './CloseButton';
import FilterDropdown from './FilterDropdown';
import { buildParamsForFilterValue, isFilterValueInParams } from './utils';


export default function SimpleFilter({ filter, searchParams, projectId, projectView }
        : { filter: ResultFilter, searchParams: URLSearchParams, projectId?: string,
            projectView?: ProjectView }): ReactElement {

    if (!filter.values.length) return null;

    return <FilterDropdown filter={ filter } params={ searchParams } projectId={ projectId }
                           projectView={ projectView }>
        { filter.values.map((bucket: FilterBucket) => renderFilterValue(filter.name, bucket, searchParams, projectId,
            projectView)) }
    </FilterDropdown>;
}


const renderFilterValue = (key: string, bucket: FilterBucket, params: URLSearchParams,
                           projectId?: string, projectView?: ProjectView): ReactNode =>
    <Dropdown.Item
            as={ Link }
            key={ bucket.value.name }
            style={ filterValueStyle }
            to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
                + buildParamsForFilterValue(params, key, bucket.value.name) }>
        { getLabel(bucket.value) }
        {
            isFilterValueInParams(params, key, bucket.value.name)
            && <CloseButton params={ params } filterKey={ key } value={ bucket.value.name }
                            projectId={ projectId } projectView={ projectView } />
        }
        <span className="float-right"><em>{ bucket.count }</em></span>
    </Dropdown.Item>;


const filterValueStyle: CSSProperties = {
    width: '365px',
};
