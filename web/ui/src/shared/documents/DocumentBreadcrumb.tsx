import React, { ReactElement } from 'react';
import { Breadcrumb, Col, Row } from 'react-bootstrap';

export interface BreadcrumbItem {
    identifier: string;
    url: string;
    id?: string;
    active?: boolean;
}

interface DocumentBreadcrumbProps {
    breadcrumbs: BreadcrumbItem[];
}

export default function DocumentBreadcrumb({ breadcrumbs }: DocumentBreadcrumbProps): ReactElement {

    if (breadcrumbs.length > 0) {
        breadcrumbs[breadcrumbs.length - 1].active = true;
    }

    return (
        <Row>
            <Col>
                <Breadcrumb>
                    { breadcrumbs.map(renderBreadcrumbItem) }
                </Breadcrumb>
            </Col>
        </Row>
    );
}

const renderBreadcrumbItem = (item: BreadcrumbItem): ReactElement =>
    <Breadcrumb.Item key={ `hierar_${item.id}` } href={ item.url } active={ item.active }>
        { item.identifier }
    </Breadcrumb.Item>;
