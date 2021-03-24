import { IonButton, IonCol, IonContent, IonGrid,
        IonHeader, IonModal, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import React, { ReactElement } from 'react';

interface AddObjectModalProps {
    show: boolean;
    onCancel: () => void;
}

export default function AddObjectModal({ show, onCancel }: AddObjectModalProps): ReactElement {
    return (
        <IonModal isOpen={ show }>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className="ion-text-center">Add object</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            add Foto
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            record message
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton fill="clear" onClick={ onCancel }>Cancel</IonButton>
                        </IonCol>
                        <IonCol>
                            <IonButton>Save</IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>

        </IonModal>
    );
}
