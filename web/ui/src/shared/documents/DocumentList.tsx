import React, { CSSProperties, ReactElement } from 'react';
import { ResultDocument } from '../../api/result';
import DocumentTeaser from '../document/DocumentTeaser';


interface DocumentListProps {
    documents: ResultDocument[];
    searchParams: URLSearchParams;
    onMouseEnter?: (document: ResultDocument) => void;
    onMouseLeave?: () => void;
}


export default function DocumentList({ documents, searchParams, onMouseEnter, onMouseLeave }
        : DocumentListProps): ReactElement {

    return documents?.length > 0 ? (
        <div className="documents" onMouseLeave={ () => onMouseLeave && onMouseLeave() }>
            { documents.map((document: ResultDocument) => {
                const linkUrl = `/project/${document.project}/search/${document.resource.id}?${searchParams}`;
                return <div style={ documentContainerStyle } key={ document.resource.id }
                            onMouseEnter={ () => onMouseEnter && onMouseEnter(document) }>
                    <DocumentTeaser document={ document } linkUrl={ linkUrl } />
                </div>;
            }
            )}
        </div>
    ) : <></>;
}


const documentContainerStyle: CSSProperties = {
    borderBottom: '1px solid var(--main-bg-color)'
};
