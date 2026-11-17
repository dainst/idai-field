import { SyncStatus } from 'idai-field-core';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/common/Input';
import Row from '@/components/common/Row';
import ScanBarcodeButton from './ScanBarcodeButton';
import SyncSettingsButton from './Sync/SyncSettingsButton';

interface SearchBarProps {
  syncStatus: SyncStatus;
  issueSearch: (q: string) => void;
  onQrCodeScanned: (data: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  syncStatus,
  issueSearch,
  onQrCodeScanned,
}) => {
  const insets = useSafeAreaInsets();

  const [q, setQ] = useState<string>('');

  return (
    <Row style={[styles.container, { marginTop: insets.top + 5 }]}>
      <Input
        placeholder="Search..."
        style={styles.input}
        onChangeText={setQ}
        onEndEditing={() => issueSearch(q)}
        // hideBorder
      />
      {renderRightIcons(syncStatus, onQrCodeScanned)}
    </Row>
  );
};


const renderRightIcons = (
  syncStatus,
  onQrCodeScanned: (data: string) => void
) => (
  <>
    <ScanBarcodeButton onQrCodeScanned={onQrCodeScanned} />
    <SyncSettingsButton status={syncStatus} />
  </>
);

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 3,
    backgroundColor: 'white',
    opacity: 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 5,
    zIndex: 10,
  },
  input: {
    flex: 1,
  },
});

export default SearchBar;
