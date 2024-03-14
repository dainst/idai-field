import { mdiSubdirectoryArrowRight } from '@mdi/js';
import Icon from '@mdi/react';
import React, { CSSProperties, ReactElement, ReactNode, useRef } from 'react';
import { Card } from 'react-bootstrap';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { ResultDocument } from '../../api/result';
import DocumentTeaser from '../document/DocumentTeaser';
import LinkButton from '../linkbutton/LinkButton';
import './document-hierarchy.css';


interface DocumentHierarchyProps {
    documents: ResultDocument[];
    predecessors: ResultDocument[];
    project: string;
    searchParams?: URLSearchParams;
    onScroll: (e: React.UIEvent<Element, UIEvent>) => void;
    onMouseEnter?: (document: ResultDocument) => void;
    onMouseLeave?: () => void;
}


export default function DocumentHierarchy({ documents, predecessors, project, searchParams,
        onScroll, onMouseEnter, onMouseLeave }: DocumentHierarchyProps): ReactElement {

    const parent: string = searchParams.get('parent') ?? 'root';
    const previousPredecessors = useRef<ResultDocument[]>([]);

    const className: string = getTransitionClassname(previousPredecessors.current, parent);
    previousPredecessors.current = predecessors || [];

    if (!documents || !predecessors) return <></>;

    return <Card.Body className="px-0 py-0" style={ cardBodyStyle }>
        <TransitionGroup className={ className } style={ groupStyle } >
            <CSSTransition key={ parent } timeout={ 500 }>
                <div className="document-hierarchy">
                    {
                        parent !== 'root' &&
                        <LinkButton
                            to={ `/project/${project}/hierarchy?parent=${ getGrandparent(predecessors) }` }
                            className="previous-button"
                            style={ { color: 'var(--main-link-color)' } }
                            variant={ 'link' }>
                            <Icon path={ mdiSubdirectoryArrowRight } vertical rotate={ 90 } size={ 0.8 } />
                        </LinkButton>
                    }
                    <div className="documents" onScroll={ onScroll }
                            onMouseLeave={ () => onMouseLeave && onMouseLeave() }>
                        { documents.map((document: ResultDocument) => {
                            return renderDocumentRow(document, searchParams, onMouseEnter);
                        }) }
                    </div>
                </div>
            </CSSTransition>
        </TransitionGroup>
    </Card.Body>;
}


const renderDocumentRow = (document: ResultDocument, searchParams: URLSearchParams,
        onMouseEnter?: (document: ResultDocument) => void): ReactNode => {

    const linkUrl = `/project/${document.project}/hierarchy/${document.resource.id}?${searchParams}`;
    
    return <div style={ documentRowStyle } key={ document.resource.id }
                onMouseEnter={ () => onMouseEnter && onMouseEnter(document) }>
        <div style={ documentTeaserContainerStyle }>
            <DocumentTeaser document={ document } linkUrl={ linkUrl } />
        </div>
        { document.resource.childrenCount > 0 && <div>
            <LinkButton to={ '?' + getHierarchyButtonSearchParams(searchParams, document.resource.id) }
                style={ { height: '100%', padding: '0.375rem', color: 'var(--main-link-color)' } } variant={ 'link' }>
                <Icon path={ mdiSubdirectoryArrowRight } size={ 0.8 } />
            </LinkButton>
        </div> }
    </div>;
};


const getHierarchyButtonSearchParams = (_searchParams: URLSearchParams, documentId: string) => {
    // We deliberately set back everything here in order
    // to get rid of any category filters or specific field filters.
    // See also comment in SearchBar.tsx
    const params = new URLSearchParams();
    params.set('parent', documentId);
    return params.toString();
};


const getTransitionClassname = (previousPredecessors: ResultDocument[], parent: string): string => {

    return isBackwardsTransition(previousPredecessors, parent)
        ? 'document-list-transition backward'
        : 'document-list-transition';
};


const isBackwardsTransition = (previousPredecessors: ResultDocument[], parent: string): boolean => {

    return previousPredecessors.map(document => document.resource.id).includes(parent) || parent === 'root';
};


const getGrandparent = (predecessors: ResultDocument[]): string => {

    return predecessors.length > 1
        ? predecessors[predecessors.length - 2].resource.id
        : 'root';
};


const cardBodyStyle: CSSProperties = {
    height: '100%'
};


const documentRowStyle: CSSProperties = {
    borderBottom: '1px solid var(--main-bg-color)',
    display: 'flex'
};


const documentTeaserContainerStyle: CSSProperties = {
    flexGrow: 1
};


const groupStyle: CSSProperties = {
    height: '100%',
    position: 'relative'
};
