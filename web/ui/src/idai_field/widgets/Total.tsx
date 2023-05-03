import { mdiMenuLeft } from '@mdi/js';
import Icon from '@mdi/react';
import React, { CSSProperties, ReactElement } from 'react';
import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ResultFilter } from '../../api/result';
import { getUserInterfaceLanguage } from '../../shared/languages';
import Filters from '../filter/Filters';
import { ProjectView } from '../project/Project';


interface TotalProperties {
    total: number;
    filters: ResultFilter[];
    searchParams: URLSearchParams;
    projectId?: string;
    projectView?: ProjectView;
    asLink?: boolean;
    setMapHighlightedCategories?: (categories: string[]) => void;
}

export default function Total({ total, filters, searchParams, projectId, projectView, asLink,
        setMapHighlightedCategories }: TotalProperties): ReactElement {

    const { t } = useTranslation();

    if (projectView === 'search' && total === undefined) return <></>;
    if (projectView !== 'search' && !total) return <></>;

    const children = <>
        { t('widgets.total.total') }
        <b key="project-total"> { total.toLocaleString(getUserInterfaceLanguage()) } </b>
        { t('widgets.total.resources') }
    </>;

    return <Card className="d-flex flex-row">
        { asLink && projectId && projectView
            ? <div style={ totalTextStyle } className="py-2 px-3">
                <Link to={ `/project/${projectId}/${projectView}?${searchParams}` }>
                    <Icon path={ mdiMenuLeft } size={ 0.8 }></Icon>
                    { children }
                </Link>
            </div>
            : <>
                <div style={ totalTextStyle } className="py-2 px-3">
                    { children }
                </div>
                    <Filters filters={ filters.filter(filter => filter.name !== 'project') }
                            searchParams={ searchParams } projectId={ projectId } projectView={ projectView }
                            onMouseOverCategories={ setMapHighlightedCategories } />
            </>
        }
    </Card>;
}


const totalTextStyle: CSSProperties = {
    flexGrow: 1
};
