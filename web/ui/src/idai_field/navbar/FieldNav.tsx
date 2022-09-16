import { mdiMenuRight } from '@mdi/js';
import Icon from '@mdi/react';
import { Location } from 'history';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { Nav, NavDropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { Document } from '../../api/document';
import { get } from '../../api/documents';
import { LoginContext } from '../../shared/login';
import BaseNav, { BaseNavProps, getNavItemClass } from '../../shared/navbar/BaseNav';
import { dropdownStyle } from '../../shared/navbar/styles';
import { getProjectLabel } from '../projects';


const ROUTES_WITH_PROJECT = ['/project/', '/type/', '/image/'];


export default function FieldNav({ onLogout }: BaseNavProps): ReactElement {

    const [projectDocument, setProjectDocument] = useState<Document>(null);
    const location = useLocation();
    const loginData = useContext(LoginContext);
    const history = useHistory();
    const { t } = useTranslation();

    useEffect(() => {

        const projectId: string | undefined = getProjectId(location);
        if (projectId) {
            get(projectId, loginData.token).then(setProjectDocument);
        } else {
            setProjectDocument(null);
        }
    }, [location, loginData]);

    const NavItemClass = (route: string) => getNavItemClass(route, getCurrentRoute(location, projectDocument));

    return (
        <BaseNav onLogout={ onLogout } brand="field">
            <Nav activeKey={ location.pathname } className="mr-auto">
                <Nav.Link as="span">
                    <Link to="/" className={ NavItemClass('overview') }>
                        { t('navbar.projects') }
                    </Link>
                </Nav.Link>
                {
                    projectDocument && <>
                        <Icon path={ mdiMenuRight } size={ 1 } className="navbar-project-arrow" />
                        <Nav.Link as="span">
                            <Link to={ `/project/${projectDocument.resource.id}` }
                                className={ NavItemClass('project') }>
                                { getProjectLabel(projectDocument) }
                            </Link>
                        </Nav.Link>
                    </>
                }
            </Nav>
            <Nav className="justify-content-end">
                <NavDropdown id="desktop-dropdown" as="span"
                            className={ NavItemClass('desktop') }
                            title={ t('navbar.desktop') }
                            style={ dropdownStyle }>
                    <NavDropdown.Item onClick={ () => history.push('/download') } >
                        { t('navbar.download') }
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={ () => history.push('/manual') }>
                        { t('navbar.manual') }
                    </NavDropdown.Item>
                </NavDropdown>
                <Nav.Link as="span">
                    <Link to="/contact" className={ NavItemClass('contact') }>
                        { t('navbar.contact') }
                    </Link>
                </Nav.Link>
                { loginData.isAdmin === true &&
                <Nav.Link as="span">
                    <Link to="/dashboard" className={ NavItemClass('dashboard') }>
                        { 'Dashboard' }
                    </Link>
                </Nav.Link> }
            </Nav>
        </BaseNav>
    );
}


const getProjectId = (location: Location): string | undefined => {

    return (ROUTES_WITH_PROJECT.filter(route => location.pathname.startsWith(route)).length === 1)
        ? location.pathname.split('/')[2]
        : undefined;
};


const getCurrentRoute = (location: Location, projectDocument?: Document): string => {

    if (projectDocument && (ROUTES_WITH_PROJECT.filter(route => location.pathname.startsWith(route)).length === 1)
            && location.pathname.split('/')[2] === projectDocument.resource.id) {
        return 'project';
    } else if (location.pathname.startsWith('/download') || location.pathname.startsWith('/manual')) {
        return 'desktop';
    } else if (location.pathname.startsWith('/contact')) {
        return 'contact';
    } else if (location.pathname.startsWith('/login')) {
        return 'login';
    } else {
        return 'overview';
    }
};
