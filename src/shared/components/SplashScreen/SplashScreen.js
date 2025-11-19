import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      {/* <Image source={require('../../assets/avocado.png')} style={styles.logo} /> */}
      <ActivityIndicator size="large" color="#00bfff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02111B',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
});

export default SplashScreen;
