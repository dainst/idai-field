import React, { ReactElement, useEffect, useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import ImageView from '../shared/image/ImageView';
import TypeView from './type/TypeView';
import { doLogout, getLoginData, LoginContext } from '../shared/login';
import LoginForm from '../shared/loginform/LoginForm';
import Contact from './contact/Contact';
import Dashboard from './dashboard/Dashboard';
import Download from './download/Download';
import Manual from './manual/Manual';
import FieldNav from './navbar/FieldNav';
import ProjectsOverview from './overview/ProjectsOverview';
import Project from './project/Project';
import ProjectHome from './project/ProjectHome';
import ResourceRedirect from './ResourceRedirect';


export default function Field(): ReactElement {

    const [loginData, setLoginData] = useState(getLoginData());

    useEffect(() => {

        document.title = 'iDAI.field';
    }, []);

    return (
        <BrowserRouter>
            <LoginContext.Provider value={ loginData }>
                <FieldNav onLogout={ doLogout(setLoginData) } />
                <Switch>
                    <Route path="/resource/:project/:identifier" component={ ResourceRedirect } />
                    <Redirect from="/resources/:project/:identifier" to="/resource/:project/:identifier" />

                    <Route path="/project/:projectId" exact component={ ProjectHome } />
                    <Route path="/project/:projectId/:view/:documentId?" component={ Project } />

                    <Redirect from="/document/:projectId/:documentId" to="/project/:projectId/hierarchy/:documentId" />

                    <Route path="/download" component={ Download } />

                    <Route path="/manual" component={ Manual } />

                    <Route path="/contact" component={ Contact } />

                    <Route path="/dashboard" component={ Dashboard } />

                    <Route path="/login">
                        <LoginForm onLogin={ setLoginData } />
                    </Route>

                    <Route path="/image/:project/:id" component={ ImageView } />

                    <Route path="/type/:project/:documentId?" component={ TypeView } />

                    <Route path="/" component={ ProjectsOverview } />
                </Switch>
            </LoginContext.Provider>
        </BrowserRouter>
    );
}
