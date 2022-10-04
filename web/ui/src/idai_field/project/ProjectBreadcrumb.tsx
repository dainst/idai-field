import { mdiDotsVertical, mdiSubdirectoryArrowRight } from '@mdi/js';
import Icon from '@mdi/react';
import React, { CSSProperties, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Document } from '../../api/document';
import { get } from '../../api/documents';
import { ResultDocument } from '../../api/result';
import { getHierarchyLink } from '../../shared/document/document-utils';
import DocumentTeaser from '../../shared/document/DocumentTeaser';
import { LoginContext } from '../../shared/login';
import './project-breadcrumb.css';
import ProjectHierarchyButton from './ProjectHierarchyButton';


const MAX_BREADCRUMB_ITEMS: number = window.screen.height <= 800 ? 2 : 3;


interface ProjectBreadcrumbProps {
    projectId: string;
    predecessors: ResultDocument[];
}


export default function ProjectBreadcrumb({ projectId, predecessors }: ProjectBreadcrumbProps): ReactElement {

    const [projectDocument, setProjectDocument] = useState<Document>();
    const loginData = useContext(LoginContext);

    useEffect(() => {

        get(projectId, loginData.token).then(setProjectDocument);
    }, [projectId, loginData]);

    const [predecessorsHead, predecessorsTail] = limitPredecessors(predecessors);

    return <>
        { projectDocument && <ProjectHierarchyButton projectDocument={ projectDocument } /> }
        { predecessorsHead.length > 0 && renderPlaceholder(predecessorsHead) }
        { predecessorsTail.map(renderPredecessor) }
    </>;
}


const renderPlaceholder = (predecessors: ResultDocument[]): ReactNode =>
    <div className="placeholder">
        <OverlayTrigger trigger="click" placement="bottom" rootClose
                overlay={ renderPlaceholderPopover(predecessors) }>
            <Icon path={ mdiDotsVertical } size={ 1 } color="grey" />
        </OverlayTrigger>
    </div>;


const renderPlaceholderPopover = (predecessors: ResultDocument[]): ReactElement =>
    <Popover id="placeholder-popover">
        <Popover.Content>
            { predecessors.map(renderPredecessor) }
        </Popover.Content>
    </Popover>;


const renderPredecessor = (predecessor: ResultDocument|null, i: number): ReactNode =>
    <div style={ predecessorContainerStyle(i) }
            key={ predecessor.resource.id }
            className="d-flex">
        <div style={ { flexGrow: 1 } }>
            <div style={ iconContainerStyle }>
                <Icon path={ mdiSubdirectoryArrowRight } size={ 0.8 } color="grey" />
            </div>
            <DocumentTeaser document={ predecessor }
                linkUrl={ getHierarchyLink(predecessor) }
                showShortDescription="singleLine"
                size="small" />
        </div>
    </div>;


const limitPredecessors = (predecessors: ResultDocument[]): [ResultDocument[], ResultDocument[]] => {

    const tail = JSON.parse(JSON.stringify(predecessors));
    let head = [];
    
    if (predecessors.length > MAX_BREADCRUMB_ITEMS) {
        head = tail.splice(0, predecessors.length - MAX_BREADCRUMB_ITEMS);
    }

    return [head, tail];
};


const predecessorContainerStyle = (i: number): CSSProperties => ({
    position: 'relative',
    marginLeft: `${(i+1) * 35}px`
});


const iconContainerStyle: CSSProperties = {
    position: 'absolute',
    left: '-20px',
    top: '6px',
    zIndex: 10
};
