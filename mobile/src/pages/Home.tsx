import React, { ReactElement, CSSProperties, useEffect, useState } from 'react';
import { settings } from 'ionicons/icons';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import { listOperations, setupDB, setupReplication } from '../pouchdb-service';
import { Map } from 'ol';
import olms from 'ol-mapbox-style';
import {
    IonPage, 
    IonHeader, 
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent
    } from '@ionic/react';
import SideDraw from '../components/SideDraw';

const MAPBOX_KEY = 'pk.eyJ1Ijoic2ViYXN0aWFuY3V5IiwiYSI6ImNrOTQxZjA4MzAxaGIzZnBwZzZ4c21idHIifQ._2-exYw4CZRjn9WoLx8i1A';

export default function Home(): ReactElement {

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

    return (
        <>
        <ProjectSettingsModal show={ showSettings } settingsSavedClickHandler={ settingsSaved }/>
        <SideDraw 
            operations={operations}
            syncStatus={syncStatus}
            loadOperations={loadOperations}
            db={db}/>
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{ dbName }</IonTitle>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
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
      </IonPage>
      </>
    )
}

const createMap = (): Map => 
  olms('ol-map', 'https://api.mapbox.com/styles/v1/sebastiancuy/ckff2undp0v1o19mhucq9oycb?access_token=' + MAPBOX_KEY);


const mapStyle: CSSProperties = {
    width: '100%',
    height: '100%'
  };