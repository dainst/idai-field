import React, { ReactElement, useState } from 'react';
import { IonModal, IonList, IonItem, IonLabel, IonInput, IonButton } from '@ionic/react';

interface ProjectSettingsModalProps {
    show: boolean;
    settingsSavedClickHandler: (dbName: string, remoteUser: string, remotePassword: string) => void;
}

export default function ProjectSettingsModal({ show, settingsSavedClickHandler }:
    ProjectSettingsModalProps ): ReactElement{

    const [dbName, setDbName] = useState<string>('test');
    const [remoteUser, setRemoteUser] = useState<string>('');
    const [remotePassword, setRemotePassword] = useState<string>('');
    

    return (
        <IonModal isOpen={ show }>
            <IonList>
                <IonItem>
                    <IonLabel>Projekt</IonLabel>
                    <IonInput value={ dbName } onIonChange={ (e) => setDbName(e.detail.value) }></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Nutzername</IonLabel>
                    <IonInput value={ remoteUser } onIonChange={ (e) => setRemoteUser(e.detail.value) }></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Passwort</IonLabel>
                    <IonInput
                        type="password"
                        value={ remotePassword }
                        onIonChange={ (e) => setRemotePassword(e.detail.value) } />
                </IonItem>
            </IonList>
            <IonButton onClick={ () => settingsSavedClickHandler(dbName,remoteUser, remotePassword) }>
                Speichern
            </IonButton>
        </IonModal>
    );
}
