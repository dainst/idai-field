import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';


const Card: React.FC<ViewProps> = (props) => {
    return <View
        style={ { ...styles.card, ...props.style as ViewStyle } }>
            {props.children}
        </View>;

};

const styles = StyleSheet.create({
    card: {
      shadowColor: 'black',
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      shadowOpacity: 0.26,
      elevation: 15,
      backgroundColor: 'white',
      padding: 20,
    }
  });

export default Card;