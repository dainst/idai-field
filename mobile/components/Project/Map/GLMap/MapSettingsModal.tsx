import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Document } from 'idai-field-core';
import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Heading from '@/components/common/Heading';
import Row from '@/components/common/Row';
import TitleBar from '@/components/common/TitleBar';

const ICON_SIZE = 24;
const ICON_COLOR = '#565350';

interface MapSettingsModalProps {
  onClose: () => void;
  pointRadius: number;
  onChangePointRadius: (radius: number) => void;
  layerInfo: { doc: Document; visible: boolean }[];
  showLayer: (docId: string) => void;
  focusMapOnLayer: (docId: string) => void;
}

const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
  onClose,
  pointRadius,
  onChangePointRadius,
  layerInfo,
  showLayer,
  focusMapOnLayer,
}) => {
  const renderItem = ({
    item,
  }: {
    item: { doc: Document; visible: boolean };
  }) => (
    <Row style={{ margin: 2 }}>
      <TouchableOpacity
        style={{ marginRight: 5 }}
        onPress={() => showLayer(item.doc.resource.id)}
      >
        <Ionicons
          name={item.visible ? 'eye' : 'eye-off'}
          size={24}
          color={ICON_COLOR}
        />
      </TouchableOpacity>
      {item.visible && (
        <TouchableOpacity onPress={() => focusMapOnLayer(item.doc.resource.id)}>
          <MaterialIcons
            name="center-focus-strong"
            size={ICON_SIZE}
            color={ICON_COLOR}
          />
        </TouchableOpacity>
      )}
      <Text
        style={{
          fontSize: 18,
          marginLeft: !item.visible ? ICON_SIZE : 0,
          padding: 2,
        }}
      >
        {item.doc.resource.id}
      </Text>
    </Row>
  );

  return (
    <Modal
      onRequestClose={onClose}
      animationType="fade"
      transparent
      visible={true}
    >
      <View style={styles.container}>
        <Card style={styles.card}>
          <TitleBar
            title={
              <>
                <Ionicons
                  name="settings-outline"
                  size={25}
                  color={colors.primary}
                  style={{ marginRight: 2 }}
                />
                <Heading>Map Settings</Heading>
              </>
            }
            left={
              <Button
                title="Close"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onClose}
              />
            }
          />
          <Row style={styles.sliderContainer}>
            <Text style={styles.sectionHeader}>Point radius: </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.2}
              maximumValue={4}
              minimumTrackTintColor="#5572a1"
              maximumTrackTintColor="gray"
              thumbTintColor={colors.primary}
              value={pointRadius}
              step={0.25}
              onValueChange={onChangePointRadius}
            />
          </Row>
          {layerInfo.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Layers</Text>
              <FlatList
                data={layerInfo}
                keyExtractor={(item) => item.doc.resource.id}
                renderItem={renderItem}
              />
            </>
          )}
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 200,
    alignItems: 'center',
  },
  card: {
    padding: 10,
    height: '60%',
    width: '60%',
    opacity: 0.9,
  },
  heading: {
    marginLeft: 10,
  },
  sliderContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'black',
    width: '80%',
    margin: 5,
  },
  slider: {
    width: 200,
    height: 40,
  },
  sectionHeader: {
    fontSize: 18,
  },
});

export default MapSettingsModal;
