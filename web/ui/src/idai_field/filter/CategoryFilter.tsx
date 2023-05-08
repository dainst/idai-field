import React, { CSSProperties, ReactElement, ReactNode, useState, useEffect } from 'react';
import { Col, Dropdown, Row } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import { flatten, sameset } from 'tsfun';
import { FilterBucketTreeNode, ResultFilter } from '../../api/result';
import CategoryIcon from '../../shared/document/CategoryIcon';
import { getLabel } from '../../shared/languages';
import { ProjectView } from '../project/Project';
import CloseButton from './CloseButton';
import { buildParamsForFilterValue, isFilterValueInParams } from './utils';
import FieldFilters from './FieldFilters';
import { deleteFilterFromParams } from '../../api/query';


export default function CategoryFilter({ filter, searchParams = new URLSearchParams(), projectId, projectView,
        onMouseEnter, onMouseLeave, inPopover }: { filter: ResultFilter, searchParams?: URLSearchParams,
        projectId?: string, projectView?: ProjectView, onMouseEnter?: (categories: string[]) => void,
        onMouseLeave?: (categories: string[]) => void, inPopover: boolean }): ReactElement {

    const history = useHistory();

    const [filters, setFilters] = useState<[string,string][]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    const inProjectPopover = projectView !== 'overview' && inPopover;

    useEffect(() => {
        if (inProjectPopover) {
            if (!sameset(categories, searchParams.getAll('category'))) {
                setCategories(searchParams.getAll('category'));
                setFilters([]);
            } else {
                const newFilters = extractFiltersFromSearchParams(searchParams);
                if (searchParams.getAll('category').length === 0 && newFilters.length !== 0) {
                    history.push(`/project/${projectId}/${projectView}?`);
                }
                setFilters(newFilters);
            }
        }
    }, [searchParams, categories, inProjectPopover, projectId, projectView, history]);

    const filterValues = filter[!inProjectPopover || searchParams.getAll('category').length === 1
        ? 'values'
        // note that at this point unfilteredValues (part of the filter buckets) should not
        // be necessary anymore. in principle we should be able to remove it from the frontend
        // and the backend (unfiltered_values). however, when that was tried there was a problem
        // with an infinite render loop which couldn't be resolved in that moment
        : 'unfilteredValues']; 

    return <div onMouseLeave={ () => onMouseLeave && onMouseLeave([]) }>
        { filterValues
            .map((bucket: FilterBucketTreeNode) =>
                renderFilterValue(filter.name, bucket, searchParams, filters,
                    projectId, projectView, onMouseEnter)) }

        { false && // TODO remove
            projectId && projectView && inProjectPopover
            &&
            <FieldFilters
              projectId={ projectId }
              projectView={ projectView }
              searchParams={ searchParams }
              filter={ filter }
              filters={ filters }
              setFilters={ setFilters }
              filterValuesCount={ filterValues.length } />
        }
    </div>;
}


const buildParams = (params: URLSearchParams, key: string, bucket: FilterBucketTreeNode,
    filters: [string, string][]) => {

    const params_ = filters.reduce((acc, [k, v]) =>
        buildParamsForFilterValue(acc, k.replace('%3A', ':'), v), params);
    return buildParamsForFilterValue(deleteFilterFromParams(params_, key),
        key, bucket.item.value.name);
};


const renderFilterValue = (key: string, bucket: FilterBucketTreeNode, params: URLSearchParams,
        filters: [string, string][], projectId?: string, projectView?: ProjectView,
        onMouseEnter?: (categories: string[]) => void, level: number = 1): ReactNode => {

    if (bucket.item.count === 0) return null; // this is for the case where we deal with unfiltered values
    const key_ = 'resource.category.name' ? 'category' : key;

    return <React.Fragment key={ bucket.item.value.name }>
        <Dropdown.Item
                as={ Link }
                style={ filterValueStyle(level) }
                onMouseOver={ () => onMouseEnter && onMouseEnter(getCategoryAndSubcategoryNames(bucket)) }
                to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
                    + buildParams(params, key_, bucket, filters) + '' }>
            <Row>
                <Col xs={ 1 }><CategoryIcon category={ bucket.item.value }
                                            size="30" /></Col>
                <Col style={ categoryLabelStyle }>
                    { getLabel(bucket.item.value) }
                    {
                        isFilterValueInParams(params, key_, bucket.item.value.name)
                        && <CloseButton params={ params } filterKey={ key_ } value={ bucket.item.value.name }
                                        projectId={ projectId } projectView={ projectView } />
                    }
                </Col>
                {
                    <Col xs={ 1 }
                        style={ { margin: '3px' } }>
                        <span className="float-right"><em>{ bucket.item.count }</em></span>
                    </Col>
                }
            </Row>
        </Dropdown.Item>
        { bucket.trees && bucket.trees.map((b: FilterBucketTreeNode) =>
            renderFilterValue(key_, b, params, filters, projectId, projectView,
                onMouseEnter, level + 1))
        }
    </React.Fragment>;
    };


const getCategoryAndSubcategoryNames = (bucket: FilterBucketTreeNode): string[] => {

    return [bucket.item.value.name].concat(
        flatten(bucket.trees.map(subBucket => getCategoryAndSubcategoryNames(subBucket)))
    );
};


const filterValueStyle = (level: number): CSSProperties => ({
    paddingLeft: `${level * 1.2}em`
});


const categoryLabelStyle: CSSProperties = {
    margin: '3px 10px',
    whiteSpace: 'normal'
};


const extractFiltersFromSearchParams = (searchParams: URLSearchParams) =>
    searchParams
        .toString()
        .split('&')
        .filter(param => !param.startsWith('resource'))
        .map(param => param.split('='))
        // .filter is a hack for as of yet not further investigated problem
        .filter(([k, v]) => !(k === '' && v === undefined)) as undefined as [string, string][];
