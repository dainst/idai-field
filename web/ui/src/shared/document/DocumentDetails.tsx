import { mdiChevronLeft, mdiChevronRight, mdiOpenInNew } from '@mdi/js';
import { Icon } from '@mdi/react';
import { TFunction } from 'i18next';
import { Dating, Dimension, I18N, Literature, OptionalRange } from 'idai-field-core';
import React, { CSSProperties, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { convertMeasurementPosition, Document, Field, FieldGroup, FieldValue, getDocumentImages,
    isLabeled, isLabeledValue, LabeledValue } from '../../api/document';
import { search } from '../../api/documents';
import { Query } from '../../api/query';
import { Result, ResultDocument } from '../../api/result';
import { ImageCarousel } from '../image/ImageCarousel';
import { getLabel, getNumberOfUndisplayedLabels, getTranslation } from '../languages';
import { LoginContext } from '../login';
import { getDocumentLink } from './document-utils';
import DocumentTeaser from './DocumentTeaser';

const HIDDEN_FIELDS = ['id', 'identifier', 'geometry', 'georeference', 'originalFilename'];
const HIDDEN_RELATIONS = ['isDepictedIn', 'hasMapLayer', 'hasDefaultMapLayer'];
const TYPES_WITH_HIDDEN_RELATIONS = ['Type', 'TypeCatalog'];


interface DocumentDetailsProps {
    document: Document;
    baseUrl: string;
}


export default function DocumentDetails({ document, baseUrl } : DocumentDetailsProps): ReactElement {

    const location = useLocation();
    const { t } = useTranslation();
    const loginData = useContext(LoginContext);

    const images: ResultDocument[] = getDocumentImages(document);

    const childrenPerPage = 10;
    const [children, setChildren] = useState<FieldGroup>(null);
    const [childrenOffset, setChildrenOffset] = useState<number>(0);
    const [childrenCount, setChildrenCount] = useState<number>(0);
    const [maxChildrenOffset, setMaxChildrenOffset] = useState<number>(0);

    useEffect(() => {

        if (TYPES_WITH_HIDDEN_RELATIONS.includes(document.resource.category.name)) {
            return resetChildren();
        }

        loadChildren(
            document.resource.id, document.project, childrenOffset, childrenPerPage, loginData.token
        ).then((data: Result) => {

            if (data.documents.length > 0) {
                setChildrenCount(data.size);
                setMaxChildrenOffset(data.size - childrenPerPage);
                // "Fake" field group in order to display child relations, translations are created
                // on the fly because the data itself does not contain labels/descriptions for the relation
                // like the regular fields of a resource.
                setChildren({
                    name: 'Children',
                    fields: [
                        {
                            name: 'hasChildren',
                            targets: data.documents,
                            description: { 'de': 'Kindbeziehung', 'en': 'Child relation' },
                            label: {
                                'de': 'Enthält', 'en': 'Includes', 'es': 'Incluye', 'fr': 'Inclut', 'it': 'Include'
                            }
                        } as Field
                    ]
                } as FieldGroup);
            } else {
                resetChildren();
            }
        });
    }, [childrenOffset, document, loginData.token]);


    const increaseOffset = () => {
        
        if (childrenOffset + childrenPerPage > maxChildrenOffset) {
            setChildrenOffset(maxChildrenOffset);
        }
        else {
            setChildrenOffset(childrenOffset + childrenPerPage);
        }
    };
    

    const decreaseOffset = () => {

        if (childrenOffset - childrenPerPage < 0) {
            setChildrenOffset(0);
        }
        else {
            setChildrenOffset(childrenOffset - childrenPerPage);
        }
    };


    const resetChildren = () => {

        setChildrenCount(0);
        setMaxChildrenOffset(0);
        setChildren(null);
    };


    const renderPaginatedRelations = (group: FieldGroup, t: TFunction, project: string, baseUrl: string): ReactNode => {

        const relationElements = group.fields
            .filter(relation => !HIDDEN_RELATIONS.includes(relation.name))
            .map(relation => [
                <dt key={ `${relation.name}_dt` }>
                    { renderMultiLanguageText(relation, t) }
                    { childrenPerPage < childrenCount &&
                        <span>
                            <Button
                                disabled={ childrenOffset === 0 ? true : false }
                                style={ childCountTextStyle }
                                variant="link"
                                onClick={ decreaseOffset } >
                                <Icon path={ mdiChevronLeft } size={ 1 } />
                            </Button>
                            <span style={ childCountTextStyle }>
                                { childrenOffset + 1 } - { childrenOffset + childrenPerPage } / { childrenCount }
                            </span>
                            <Button
                                disabled={ childrenOffset === maxChildrenOffset ? true : false }
                                style={ childCountTextStyle }
                                variant="link"
                                onClick={ increaseOffset } >
                                <Icon path={ mdiChevronRight } size={ 1 } />
                            </Button>
                        </span>
                     }
                </dt>,
                <dd key={ `${relation.name}_dd` }>
                    <ul className="list-unstyled" style={ listStyle }>
                        { relation.targets.map(doc => renderDocumentLink(project, doc, baseUrl)) }
                    </ul>
                </dd>
            ]);

        return (
            <div key={ `${group.name}_group` }>
                { renderFieldList(group.fields.filter(field => {
                    return field.value !== undefined;
                }), t) }

                <dl style={ listStyle }>{ relationElements }</dl>
            </div>
        );
    };

    return <>
        { images && <ImageCarousel
                        images={ images }
                        document={ document }
                        location={ location }
                    />}
        { renderGroups(document, t, baseUrl) }
        { children ? renderPaginatedRelations(children, t, document.project, baseUrl) : null }
    </>;
}


const renderGroups = (document: Document, t: TFunction, baseUrl: string): ReactNode => {

    return document.resource.groups.map(
        renderGroup(t, document.project,
        baseUrl,
        TYPES_WITH_HIDDEN_RELATIONS.includes(document.resource.category.name))
    );
};


export const renderGroup = (t: TFunction, project: string, baseUrl: string, hideRelations: boolean = false) =>
    function FieldGroupRow(group: FieldGroup): ReactNode {

    return (
        <div key={ `${group.name}_group` }>
            { renderFieldList(group.fields.filter(field => {
                return field.value !== undefined;
            }), t) }
            { hideRelations
                ? null
                : renderRelationList(group.fields.filter(field => field.targets), project, t, baseUrl) }
        </div>
    );
};


const renderFieldList = (fields: Field[], t: TFunction): ReactNode => {

    const fieldElements = fields
        .filter(field => !HIDDEN_FIELDS.includes(field.name))
        .map(field => {
            const valueElements = renderFieldValue(field.value, t);
            return valueElements ? [
                <dt key={ `${field.name}_dt` }>{ renderMultiLanguageText(field, t) }</dt>,
                <dd style={ valueElementsStyle } key={ `${field.name}_dd` }>{ valueElements }</dd>
            ] : undefined;
        });
    return fieldElements ? <dl style={ listStyle }>{ fieldElements }</dl> : <></>;
};


const renderRelationList = (relations: Field[], project: string, t: TFunction, baseUrl: string): ReactNode => {

    if (!relations) return null;

    const relationElements = relations
        .filter(relation => !HIDDEN_RELATIONS.includes(relation.name))
        .map(relation => [
            <dt key={ `${relation.name}_dt` }>{ renderMultiLanguageText(relation, t) }</dt>,
            <dd key={ `${relation.name}_dd` }>
                <ul className="list-unstyled" style={ listStyle }>
                    { relation.targets.map(doc => renderDocumentLink(project, doc, baseUrl)) }
                </ul>
            </dd>
        ]);
    return <dl style={ listStyle }>{ relationElements }</dl>;
};


const renderFieldValue = (value: FieldValue, t: TFunction): ReactNode => {

    if (Array.isArray(value)) return renderFieldValueArray(value, t);
    if (typeof value === 'object') return renderFieldValueObject(value, t);
    if (typeof value === 'boolean') return renderFieldValueBoolean(value);
    return value;
};


const renderFieldValueArray = (values: FieldValue[], t: TFunction): ReactNode =>
    values.length > 1
        ? <ul>{ values.map((value, i) => <li key={ `${value}_${i}` }>{ renderFieldValue(value, t) }</li>) }</ul>
        : renderFieldValue(values[0], t);


const renderFieldValueObject = (object: FieldValue, t: TFunction): ReactNode | undefined => {

    if (isLabeledValue(object)) return renderMultiLanguageText(object, t);
    if (isLabeled(object)) return object.label;
    if (Dating.isDating(object)) return Dating.generateLabel(object, t,
        // eslint-disable-next-line
        (value: any) => getLabel({ name: undefined, label: value }));
    if (Literature.isLiterature(object)) return renderLiterature(object, t);

    const isOptionalRange = OptionalRange.buildIsOptionalRange(isLabeledValue);
    if (isOptionalRange(object) && OptionalRange.isValid(object)) return renderOptionalRange(object, t);
    const object1 = convertMeasurementPosition(object);
    if (Dimension.isDimension(object1)) {
        const labeledPosition =
            (object as Dimension).measurementPosition;
        return Dimension.generateLabel(
            object1, getDecimalValue, t,
                // eslint-disable-next-line
                (value: any) => getLabel({ label: value, name: undefined }), labeledPosition
                // eslint-disable-next-line
                ? getLabel(labeledPosition as any)
                : undefined
        );
    }
    
    // We assume it is a multi language value then
    return getTranslation(object as undefined as I18N.String);
};


const renderMultiLanguageText = (object: LabeledValue, t: TFunction): ReactNode => {

    const label: string = getLabel(object);

    return object.label && getNumberOfUndisplayedLabels(object.label) > 0
        ? <OverlayTrigger trigger={ ['hover', 'focus'] } placement="right" overlay={ renderPopover(object, t) }>
            <div style={ multiLanguageTextStyle }>{ label }</div>
          </OverlayTrigger>
        : label;
};


const renderLiterature = (literature: Literature, t: TFunction): ReactNode => {

    const label: string = Literature.generateLabel(literature as Literature, t, false);

    return <>
        { label }
        { literature.zenonId &&
            <div>
                <a href={ `https://zenon.dainst.org/Record/${literature.zenonId}` }
                    target="_blank" rel="noopener noreferrer">
                    Zenon <span style={ linkIconContainerStyle }>
                        <Icon path={ mdiOpenInNew } size={ 0.8 } />
                    </span>
                </a>
            </div>
        }
    </>;
};


const renderOptionalRange = (optionalRange: OptionalRange<LabeledValue>, t: TFunction): ReactNode => {

    return optionalRange.endValue
        ? <div>
            { t('from') }
            { renderMultiLanguageText(optionalRange.value, t) }
            { t('to') }
            { renderMultiLanguageText(optionalRange.endValue, t) }
        </div>
        : renderMultiLanguageText(optionalRange.value, t);
};


const renderFieldValueBoolean = (value: boolean): ReactNode => value ? 'yes' : 'no';


const renderDocumentLink = (project: string, doc: ResultDocument, baseUrl: string): ReactNode =>
    <li key={ doc.resource.id }>
        <DocumentTeaser document={ doc } linkUrl={ getDocumentLink(doc, project, baseUrl) } size="small" />
    </li>;


const renderPopover = (object: LabeledValue, t: TFunction): ReactElement => {

    return (
        <Popover id={ 'popover-' + object.name }>
            <Popover.Content>
                { Object.keys(object.label).map(language => (
                        <div key={ language }>
                            <em>{ t('languages.' + language) }: </em>
                            { object.label[language] }
                        </div>
                    ))
                }
            </Popover.Content>
        </Popover>
    );
};

const loadChildren = async (resourceId: string, project: string, from: number, size: number,
                            token: string): Promise<Result> => {

    const childQuery = {
        q: '*',
        parent: resourceId,
        size,
        from,
        sort: 'sort',
        filters: [
            { field: 'project', value: project },
        ]
    } as Query;

    return search(childQuery, token);
};

const getDecimalValue = (value: number): string => {

    return value.toString().replace('.', ',');
};


const multiLanguageTextStyle: CSSProperties = {
    display: 'inline-block',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted'
};


const listStyle: CSSProperties = {
    marginBottom: '0'
};


const linkIconContainerStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};


const valueElementsStyle: CSSProperties = {
    whiteSpace: 'pre-line'
};

const childCountTextStyle: CSSProperties = {
    fontWeight: '400',
    paddingLeft: '0px',
    paddingRight: '0px',
    display: 'contents'
};