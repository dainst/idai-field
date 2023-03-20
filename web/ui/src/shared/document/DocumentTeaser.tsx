import React, { CSSProperties, ReactElement } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ResultDocument } from '../../api/result';
import RelativeOrAbsoluteLink from '../linkbutton/RelativeOrAbsoluteLink';
import CategoryIcon from './CategoryIcon';
import './document-teaser.css';
import { getLangStr } from '../languages';


interface DocumentTeaserProps {
    document: ResultDocument;
    size?: 'small' | 'normal';
    linkUrl?: string;
    showShortDescription?: 'full' | 'singleLine' | 'none';
}


export default React.memo(function DocumentTeaser({ document, size = 'normal', linkUrl,
        showShortDescription = 'full' }: DocumentTeaserProps): ReactElement {

    const height = (size === 'small') ? 26 : 40;
    const { t } = useTranslation();

    if (!document) return <></>;

    if (document.deleted) {
        return (<div>{ t('documentTeaser.noTargetResource') } [{ document.resource.id }]</div>);
    }

    return (
        <Row className="no-gutters document-teaser">
            <Col>
                { linkUrl
                    ? <RelativeOrAbsoluteLink url={ linkUrl } style={ linkStyle } >
                        { renderTeaser(document, size, height, linkUrl?.length > 0, showShortDescription) }
                    </RelativeOrAbsoluteLink>
                    : renderTeaser(document, size, height, linkUrl?.length > 0, showShortDescription)
                }
            </Col>
        </Row>
    );
});


const renderTeaser = (document: ResultDocument, size: string, height: number, asLink: boolean,
        showShortDescription: 'full' | 'singleLine' | 'none') => {

    const classes = `${(size === 'normal') && 'py-2 px-4'} teaser-container teaser-${size} ${asLink ? 'link' : ''}`;

    return <div className={ classes }>
        <Row>
            <Col style={ { flex: `0 0 ${height}px`, height: `${height}px` } } className="pl-2">
                <CategoryIcon size={ `${height}` }
                              category={ document.resource.category } />
            </Col>
            <Col>
                <Row>
                    <Col className="p-0">
                        { document.resource.shortDescription
                            ? <h4 className="m-0" style={ textStyle }>{ document.resource.identifier }</h4>
                            : <h3 className="my-2" style={ textStyle }>{ document.resource.identifier }</h3>
                        }
                    </Col>
                </Row>
                { document.resource.shortDescription && showShortDescription !== 'none' &&
                <Row>
                    <Col className={ 'p-0 text-muted short-description'
                            + (showShortDescription === 'full' ? '' : ' single-line') }
                         style={ textStyle }>
                        { getLangStr(document.resource.shortDescription) }
                    </Col>
                </Row>
                }
            </Col>
        </Row>
    </div>;
};


const linkStyle: CSSProperties = {
    textDecoration: 'none',
    color: 'black'
};


const textStyle: CSSProperties = {
    wordBreak: 'break-word'
};
