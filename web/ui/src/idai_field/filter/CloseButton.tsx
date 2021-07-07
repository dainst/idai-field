import { mdiCloseCircle } from '@mdi/js';
import Icon from '@mdi/react';
import React, { ReactElement } from 'react';
import { deleteFilterFromParams } from '../../api/query';
import LinkButton from '../../shared/linkbutton/LinkButton';
import { ProjectView } from '../project/Project';


export default function CloseButton({ params, filterKey, value, projectId, projectView }
        : { params: URLSearchParams, filterKey: string, value: string, projectId?: string,
            projectView?: ProjectView }): ReactElement {

    return <LinkButton
        to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
            + deleteFilterFromParams(params, filterKey, value) }
        variant="link"
        style={ { padding: 0, verticalAlign: 'baseline' } }>
        <Icon path={ mdiCloseCircle } size={ 0.8 } />
    </LinkButton>;
}
