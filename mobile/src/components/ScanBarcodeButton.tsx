import { BarCodeScanner } from 'expo-barcode-scanner';
import { Fab, Icon } from 'native-base';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

interface ScanBarcodeButtonProps {
    onBarCodeScanned: (docId: string) => void
}


const ScanBarcodeButton: React.FC<ScanBarcodeButtonProps> = ({ onBarCodeScanned }) => {

    const [hasPermission, setHasPermission] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);

    useEffect(() => {
        
        BarCodeScanner.requestPermissionsAsync()
            .then(({ status }: { status: string }) => setHasPermission(status === 'granted'));
    }, []);


    const handleBarCodeScanned = ({ data }: { data: string }) => {
        
        setScannerActive(false);
        onBarCodeScanned(data);
    };

    return hasPermission
        ? scannerActive
            ? renderBarcodeScanner(handleBarCodeScanned)
            : renderFab(setScannerActive)
        : null;
};


const renderBarcodeScanner = (handleBarCodeScanned: ({ data }: { data: string }) => void) =>
    <BarCodeScanner
        onBarCodeScanned={ handleBarCodeScanned }
        style={ StyleSheet.absoluteFill }
    />;


const renderFab = (setScannerActive: (active: boolean) => void) =>
    <Fab
        bg="white"
        shadow={ 9 }
        position="absolute"
        bottom={ 4 }
        right={ 4 }
        icon={ <Icon name="qr-code" type="Ionicons" /> }
        onPress={ () => setScannerActive(true) }
    />;


export default ScanBarcodeButton;
