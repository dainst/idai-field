import { IonApp, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonSplitPane, IonTitle, IonToolbar } from '@ionic/react';
import { menu, refresh, settings } from 'ionicons/icons';
import { Map } from 'ol';
import olms from 'ol-mapbox-style';
import React, { CSSProperties, useEffect, useState } from 'react';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import { listOperations, setupDB, setupReplication } from './pouchdb-service';


const MAPBOX_KEY = 'pk.eyJ1Ijoic2ViYXN0aWFuY3V5IiwiYSI6ImNrOTQxZjA4MzAxaGIzZnBwZzZ4c21idHIifQ._2-exYw4CZRjn9WoLx8i1A';


function App() {

  const [db, setDb] = useState<PouchDB.Database>();
  const [syncStatus, setSyncStatus] = useState<string>('db loading');
  const [operations, setOperations] = useState<any[]>();

  const [dbName, setDbName] = useState<string>('test');
  const [remoteUser, setRemoteUser] = useState<string>('');
  const [remotePassword, setRemotePassword] = useState<string>('');

 
  
  

  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {

    createMap();
  }, []);

  useEffect(() => {
    
    setSyncStatus('db loading');

    setupDB(dbName)
      .then((db) => {
        setDb(db);
        loadOperations(db);
      })
      .then(() => setSyncStatus('unsynced'))
      .catch(console.error);
  }, [dbName]);

  useEffect(() => {

    if (db && remoteUser) {
      setSyncStatus('syncing');
      setupReplication(db, remoteUser, remotePassword)
        .then(() => setSyncStatus('synced'))
        .then(() => loadOperations(db))
        .catch(() => setSyncStatus('sync error'));
    }
  }, [db, remoteUser, remotePassword])

  const loadOperations = (db?: PouchDB.Database) => {

    if (db) {
      setOperations([]);
      listOperations(db).then(setOperations);
    }
  }

  const settingsSaved = (dbName: string, remoteUser: string, remotePassword: string) => {

    setDbName(dbName);
    setRemoteUser(remoteUser);
    setRemotePassword(remotePassword);
    setShowSettings(false);
  }

  const renderToolbar = () => 
    <IonToolbar>
      <IonTitle>
        Status: { syncStatus }
      </IonTitle>
      <IonButtons slot="primary">
        <IonButton onClick={ () => loadOperations(db) }>
          <IonIcon icon={ refresh } />
        </IonButton>
      </IonButtons>
    </IonToolbar>;

  return <IonApp>
    <IonSplitPane contentId="main-content">

      
      <ProjectSettingsModal show={ showSettings } settingsSavedClickHandler={ settingsSaved }/>
      <IonMenu contentId="main-content">
        <IonHeader>
          { renderToolbar() }
        </IonHeader>
        <IonContent>
          { operations?.length ? renderOperations(operations) : 'No operations found' }
        </IonContent>
      </IonMenu>

      <div className="ion-page" id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuToggle>
                <IonButton>
                  <IonIcon slot="icon-only" icon={ menu }></IonIcon>
                </IonButton>
              </IonMenuToggle>
            </IonButtons>
            <IonTitle>{ dbName }</IonTitle>
            <IonButtons slot="primary">
              <IonButton onClick={ () => setShowSettings(true) }>
                <IonIcon icon={ settings } />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div id="ol-map" style={ mapStyle } />
        </IonContent>
      </div>

    </IonSplitPane>
  </IonApp>;
}


const createMap = (): Map => 
  olms('ol-map', 'https://api.mapbox.com/styles/v1/sebastiancuy/ckff2undp0v1o19mhucq9oycb?access_token=' + MAPBOX_KEY);


const renderOperations = (operations: any[]) =>
  <IonList>
    { operations.map(renderOperation) }
  </IonList>


const renderOperation = (operation: any) => 
  <IonItem key={ operation.resource.id }>
    <IonLabel>
      { operation.resource.identifier } - { operation.resource.shortDescription }
    </IonLabel>
  </IonItem>;


const mapStyle: CSSProperties = {
  width: '100%',
  height: '100%'
};


export default App;
