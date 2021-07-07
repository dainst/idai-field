import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { ButtonGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiCloseCircle } from '@mdi/js';
import { LoginContext } from '../../shared/login';
import { Document } from '../../api/document';
import { get } from '../../api/documents';
import LinkButton from '../../shared/linkbutton/LinkButton';
import { deleteFilterFromParams } from '../../api/query';
import { ProjectView } from '../project/Project';


export default function RelationFilter({ relationName, resourceId, params, projectId, projectView }
        : { relationName: string, resourceId: string, params: URLSearchParams, projectId?: string,
            projectView?: ProjectView }): ReactElement {

    const [document, setDocument] = useState<Document>(null);

    const loginData = useContext(LoginContext);
    const { t } = useTranslation();

    useEffect(() => {

       get(resourceId, loginData.token).then(setDocument);
    }, [resourceId, loginData]);

    return document
        ? <ButtonGroup size="sm" style={ buttonGroupStyle }>
            <LinkButton variant="primary" style={ buttonStyle }
                        to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
                            + deleteFilterFromParams(params,
                            `resource.relations.${relationName}.resource.id`,
                            resourceId) }>
                <div style={ labelStyle }>
                    <div>{ t(`filters.relations.${relationName}`) }:</div>
                    <div>{ document.resource.identifier }</div>
                </div>
                <span style={ iconStyle }>
                    <Icon path={ mdiCloseCircle } size={ 0.7 } />
                </span>
            </LinkButton>
        </ButtonGroup>
        : <></>;
}


const buttonGroupStyle: CSSProperties = {
    paddingLeft: '10px'
};


const buttonStyle: CSSProperties = {
    backgroundColor: '#5572a1',
    height: '31px',
    fontSize: '11px',
    lineHeight: '11px'
};


const labelStyle: CSSProperties = {
    float: 'left',
    position: 'relative',
    top: '-1px'
};


const iconStyle: CSSProperties = {
    position: 'relative',
    top: '3px',
    left: '3px'
};
