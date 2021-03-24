import React, { ReactElement } from 'react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import Home from './pages/Home';
import { Route } from 'react-router-dom';


export default function App(): ReactElement {

  return (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet id="main-content">
                <Route path="/" component={ Home } />
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
  );
}