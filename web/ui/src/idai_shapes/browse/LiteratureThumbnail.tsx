import React, { CSSProperties, ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ZenonRecord,ResultDocument } from '../../api/result';
import { Document } from '../../api/document';
import { mdiOpenInNew } from '@mdi/js';
import Icon from '@mdi/react';
import { Row,Col } from 'react-bootstrap';


const LABEL_HEIGHT = 30;


interface LiteratureThumbnailProps {
    literature: ZenonRecord;

}


export default React.memo(function LiteratureThumbnail({ literature}: LiteratureThumbnailProps)
    : ReactElement  {

    return (
        <Row>
            <Col>
                {literature.primaryAuthorsNames} {literature.publicationDates}
            </Col>
            <Col>
                {literature.shortTitle}
            </Col>
            <Col>
                <a href={ `https://zenon.dainst.org/Record/${literature.id}` }
                    target="_blank" rel="noopener noreferrer">
                    Zenon <span style={ linkIconContainerStyle }>
                        <Icon path={ mdiOpenInNew } size={ 0.8 } />
                    </span>
                </a>
            </Col>
        </Row>
            
    );


});



const listStyle: CSSProperties = {
    marginBottom: '0'
};


const linkIconContainerStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};


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
