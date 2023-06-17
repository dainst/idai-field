import React, { ReactElement } from 'react';
import { Redirect, useLocation, } from 'react-router-dom';
import Project from './project/Project';

export default function RewriteRedirect(): ReactElement {

    const location = useLocation();
    // This is to preserve already cited links.
    // TODO Remove and replace by nginx rewrite rule.
    // See also web/api/lib/documents/filter.ex.
    const search = 
        location.search
            .replace('resource.category.name', 'category')
            .replace('resource.period.value.name', 'period.value');
    return search !== location.search
        ? <Redirect to={ location.pathname + search } />
        : <Project />;
}
