import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, Text } from 'react-native';
import Button from '@/components/common/Button';

interface ScanBarcodeButtonProps {
    onQrCodeScanned: (docId: string) => void
}

const ScanBarcodeButton: React.FC<ScanBarcodeButtonProps> = ({ onQrCodeScanned }) => {
    const [hasPermission, setHasPermission] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        setScannerActive(false);
        onQrCodeScanned(data);
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <>
            {scannerActive ? renderBarcodeScanner(handleBarCodeScanned, setScannerActive, setScanned, scanned) : renderButton(setScannerActive)}
        </>
    );
};

const renderBarcodeScanner = (
    handleQrCodeScanned: ({ type, data }) => void,
    setScannerActive: (active: boolean) => void,
    setScanned: (scanned: boolean) => void,
    scanned: boolean
) => (
    <Modal onRequestClose={() => setScannerActive(false)}>
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleQrCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && (
                <Button
                    title={"Tap to Scan Again"}
                    onPress={() => setScanned(false)}
                />
            )}
            <Button
                icon={<Ionicons name="close" size={25} />}
                onPress={() => setScannerActive(false)}
                style={styles.fab}
            />
        </View>
    </Modal>
);

const renderButton = (setScannerActive: (active: boolean) => void) => (
    <Button
        variant="transparent"
        icon={<Ionicons name="qr-code" size={18} />}
        onPress={() => setScannerActive(true)}
        testID="barCodeScanner"
    />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
    },
    scannerContainer: {
        backgroundColor: 'black',
        flex: 1,
        elevation: 6,
    },
    fab: {
        bottom: -25,
        right: -25,
        height: 50,
        width: 50,
        borderRadius: 25,
        elevation: 10,
        justifyContent: 'center'
    }
});

export default ScanBarcodeButton;
