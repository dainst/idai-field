import React, {ReactElement} from 'react';
import { refresh } from 'ionicons/icons';
import {
    IonMenu, 
    IonHeader, 
    IonContent, 
    IonList,
    IonItem,
    IonLabel,
    IonToolbar,
    IonTitle,
    IonButtons, 
    IonButton,
    IonIcon } from '@ionic/react'

interface SideDrawProps {
    operations: any[];
    syncStatus: string;
    loadOperations: (db?: PouchDB.Database) => void;
    db: PouchDB.Database;
}

export default function SideDraw({operations, syncStatus, loadOperations, db}: SideDrawProps): ReactElement {

    const renderToolbar = () => 
        <IonToolbar>
            <IonTitle>Status: { syncStatus }</IonTitle>
            <IonButtons slot="primary">
                <IonButton onClick={ () => loadOperations(db) }>
                    <IonIcon icon={ refresh } />
                </IonButton>
            </IonButtons>
        </IonToolbar>;

    return (
        <IonMenu contentId="main-content">
            <IonHeader>
                { renderToolbar() }
            </IonHeader>
            <IonContent>
                { operations?.length ? renderOperations(operations) : 'No operations found' }
            </IonContent>
      </IonMenu>
    )
}


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