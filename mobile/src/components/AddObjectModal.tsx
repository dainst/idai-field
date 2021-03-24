import { IonButton, IonCol, IonContent, IonGrid,
        IonHeader, IonIcon, IonLabel, IonModal, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { micOutline, qrCodeOutline } from 'ionicons/icons';
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
                            <IonButton className="ion-padding-vertical" fill="clear">
                                <IonIcon className="ion-margin-end" icon={ qrCodeOutline } />
                                <IonLabel>Scan QR code</IonLabel>
                            </IonButton>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton className="ion-padding-vertical" fill="clear">
                                <IonIcon className="ion-margin-end" icon={ micOutline } />
                                <IonLabel>Record Message</IonLabel>
                            </IonButton>
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
