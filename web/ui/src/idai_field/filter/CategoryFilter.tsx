import React, { CSSProperties, ReactElement, ReactNode, useState, useEffect } from 'react';
import { Col, Dropdown, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { flatten, sameset } from 'tsfun';
import { FilterBucketTreeNode, ResultFilter } from '../../api/result';
import CategoryIcon from '../../shared/document/CategoryIcon';
import { getLabel } from '../../shared/languages';
import { ProjectView } from '../project/Project';
import CloseButton from './CloseButton';
import { buildParamsForFilterValue, isFilterValueInParams } from './utils';
import FieldFilters from './FieldFilters';


export default function CategoryFilter({ filter, searchParams = new URLSearchParams(), projectId, projectView,
        onMouseEnter, onMouseLeave, inPopover }: { filter: ResultFilter, searchParams?: URLSearchParams,
        projectId?: string, projectView?: ProjectView, onMouseEnter?: (categories: string[]) => void,
        onMouseLeave?: (categories: string[]) => void, inPopover: boolean }): ReactElement {

    const [filters, setFilters] = useState<[string,string][]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (inPopover) {
            if (!sameset(categories, searchParams.getAll('resource.category.name'))) {
                setCategories(searchParams.getAll('resource.category.name'));
                setFilters([]);
            } else {
                setFilters(extractFiltersFromSearchParams(searchParams));
            }
        }
    }, [searchParams, categories, inPopover]);

    if (!filter.values.length) return null;

    return <div onMouseLeave={ () => onMouseLeave && onMouseLeave([]) }>
        { filter.values.map((bucket: FilterBucketTreeNode) =>
            renderFilterValue(filter.name, bucket, searchParams, filters, projectId, projectView, onMouseEnter)) }

        { false && // TODO remove later
            (projectId && projectView)
            && (searchParams.getAll('resource.category.name').length === 1)
            &&
            <FieldFilters
              projectId={ projectId }
              projectView={ projectView }
              searchParams={ searchParams }
              filter={ filter }
              filters={ filters }
              setFilters={ setFilters } />
        }
    </div>;
}


const buildParams = (params: URLSearchParams, key: string, bucket: FilterBucketTreeNode,
    filters: [string, string][]) => {

    const params_ = filters.reduce((acc, [k, v]) => buildParamsForFilterValue(acc, 'resource.' + k.replace('%3A', ':'), v), params);
    return buildParamsForFilterValue(params_, key, bucket.item.value.name);
};


const renderFilterValue = (key: string, bucket: FilterBucketTreeNode, params: URLSearchParams,
        filters: [string, string][], projectId?: string, projectView?: ProjectView,
        onMouseEnter?: (categories: string[]) => void, level: number = 1): ReactNode => {

    return <React.Fragment key={ bucket.item.value.name }>
        <Dropdown.Item
                as={ Link }
                style={ filterValueStyle(level) }
                onMouseOver={ () => onMouseEnter && onMouseEnter(getCategoryAndSubcategoryNames(bucket)) }
                to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
                    + buildParams(params, key, bucket, filters) + '' }>
            <Row>
                <Col xs={ 1 }><CategoryIcon category={ bucket.item.value }
                                            size="30" /></Col>
                <Col style={ categoryLabelStyle }>
                    { getLabel(bucket.item.value) }
                    {
                        isFilterValueInParams(params, key, bucket.item.value.name)
                        && <CloseButton params={ params } filterKey={ key } value={ bucket.item.value.name }
                                        projectId={ projectId } projectView={ projectView } />
                    }
                </Col>
                <Col xs={ 1 }
                     style={ { margin: '3px' } }>
                    <span className="float-right"><em>{ bucket.item.count }</em></span>
                </Col>
            </Row>
        </Dropdown.Item>
        { bucket.trees && bucket.trees.map((b: FilterBucketTreeNode) =>
            renderFilterValue(key, b, params, filters, projectId, projectView, onMouseEnter, level + 1))
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
        .filter(param => param.startsWith('resource.'))
        .map(param => param.replace('resource.', ''))
        .filter(param => !param.startsWith('category'))
        .map(param => param.split('=')) as undefined as [string, string][];
