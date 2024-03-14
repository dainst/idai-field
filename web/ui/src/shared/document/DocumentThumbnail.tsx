import React, { CSSProperties, ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ResultDocument } from '../../api/result';
import Image from '../image/Image';
import MultiImage from '../image/MultiImage';


const LABEL_HEIGHT = 30;


interface DocumentThumbnailProps {
    document: ResultDocument;
    linkUrl: string;
    maxWidth: number;
    maxHeight: number;
}


export default React.memo(function DocumentThumbnail({ document, linkUrl, maxWidth, maxHeight }: DocumentThumbnailProps)
    : ReactElement {

    const imageId = getImageId(document);
    
    return (
        <Link to={ { pathname: linkUrl } } target={ linkUrl.startsWith('http') ? '_blank' : '' }>
            <div style={ outerStyle }>
                <div style={ innerStyle }>
                    { imageId
                        ? <Image
                            project={ document.project }
                            id={ imageId }
                            maxWidth={ maxWidth } maxHeight={ maxHeight } />
                        : <MultiImage
                            project={ document.project }
                            id={ document.resource.id }
                            maxWidth={ maxWidth } maxHeight={ maxHeight } />
                    }
                </div>
                <div className="p-1" title={ document.resource.identifier } style={ labelStyle }>
                    { document.resource.identifier }
                </div>
            </div>
        </Link>
    );
});


const getImageId = (document: ResultDocument): string => document.resource.relations?.isDepictedIn?.[0].resource.id;


const outerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
};

const innerStyle: CSSProperties = {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: `calc(100% - ${LABEL_HEIGHT}px)`
};

const labelStyle: CSSProperties = {
    height: `${LABEL_HEIGHT}px`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
};
