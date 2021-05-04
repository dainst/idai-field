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
            ? renderBarcodeScanner(handleBarCodeScanned, setScannerActive)
            : renderFab(setScannerActive)
        : null;
};


const renderBarcodeScanner = (
    handleBarCodeScanned: ({ data }: { data: string }) => void,
    setScannerActive: (active: boolean) => void
) =>
        <BarCodeScanner style={ [StyleSheet.absoluteFill, styles.scanner.container] }
            onBarCodeScanned={ handleBarCodeScanned }
        >
            <Fab
                bg="white"
                icon={ <Icon name="close" type="Ionicons" /> }
                onPress={ () => setScannerActive(false) }
            />
        </BarCodeScanner>;


const renderFab = (setScannerActive: (active: boolean) => void) =>
    <Fab
        bg="white"
        style={ styles.fab }
        icon={ <Icon name="qr-code" type="Ionicons" /> }
        onPress={ () => setScannerActive(true) }
    />;


const styles = {
    scanner: {
        container: {
            backgroundColor: 'black',
            flex: 1
        }
    },
    fab: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
};


export default ScanBarcodeButton;
