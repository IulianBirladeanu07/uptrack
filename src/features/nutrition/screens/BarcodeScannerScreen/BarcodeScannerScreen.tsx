import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles from './BarcodeScannerScreenStyle';
import { useBarcodeScanner } from '../../helpers/useBarcodeScanner';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';

type ScannerOverlayProps = {
  isScanning: boolean;
  scanLineAnimation: Animated.Value;
  instructionsVisible: boolean;
  successOpacity: Animated.Value;
  errorOpacity: Animated.Value;
};

const ScannerOverlay = ({ 
  isScanning, 
  scanLineAnimation, 
  instructionsVisible,
  successOpacity,
  errorOpacity
}: ScannerOverlayProps) => {
  if (!isScanning) return null;
  
  return (
    <View style={styles.scanningAreaOverlay}>
      <View style={styles.spotlightOverlay} />
      <View style={styles.scanningAreaBorder}>
        <Animated.View
          style={[styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLineAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={[styles.cornerDecoration, { top: 0, left: 0 }]} />
        <View style={[styles.cornerDecoration, { top: 0, right: 0 }]} />
        <View style={[styles.cornerDecoration, { bottom: 0, left: 0 }]} />
        <View style={[styles.cornerDecoration, { bottom: 0, right: 0 }]} />
      </View>

      <Animated.View
        style={[
          styles.feedbackOverlay,
          { backgroundColor: 'rgba(0, 255, 0, 0.3)', opacity: successOpacity }
        ]}
      />

      <Animated.View
        style={[
          styles.feedbackOverlay,
          { backgroundColor: 'rgba(255, 0, 0, 0.3)', opacity: errorOpacity }
        ]}
      />

      {instructionsVisible && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Position barcode within the frame to scan
          </Text>
        </View>
      )}
    </View>
  );
};

const BarcodeScannerScreen = () => {
  const navigation = useAppNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  
  const route = useAppRoute<'BarcodeScanner'>();
  const selectedDate = route.params?.selectedDate;
  const meal = route.params?.meal;

  const {
    isScanning,
    loadingProduct,
    instructionsVisible,
    successOpacity,
    errorOpacity,
    handleBarcodeScanned,
    resumeScanning,
  } = useBarcodeScanner(navigation, meal, selectedDate);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', resumeScanning);

    return unsubscribe;
  }, [navigation, resumeScanning]);

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnimation.stopAnimation();
    }
  }, [isScanning, scanLineAnimation]);

  useEffect(() => {
    let cancelled = false;
    void Camera.requestCameraPermissionsAsync()
      .then(({ status }) => {
        if (!cancelled) setHasPermission(status === 'granted');
      })
      .catch(error => {
        console.error('Failed to request camera permission:', error);
        if (!cancelled) {
          setHasPermission(false);
          Alert.alert('Camera unavailable', 'Unable to check camera permission. Please try again.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted' && !canAskAgain) {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to update camera permission:', error);
      Alert.alert('Camera unavailable', 'Unable to update camera permission. Please try again.');
    }
  };

  const closeScanner = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#888' }]}
          onPress={closeScanner}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isScanning && (
        <View style={styles.header}>
          <TouchableOpacity onPress={closeScanner} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {isScanning && (
        <CameraView
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['aztec', 'ean13', 'ean8', 'qr', 'pdf417', 'upc_e', 'datamatrix', 'code39', 'code93', 'itf14', 'codabar', 'code128', 'upc_a']
          }}
          style={StyleSheet.absoluteFillObject}
          zoom={0}
        />
      )}

      {isScanning && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeScanner}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      )}

      <ScannerOverlay 
        isScanning={isScanning}
        scanLineAnimation={scanLineAnimation}
        instructionsVisible={instructionsVisible}
        successOpacity={successOpacity}
        errorOpacity={errorOpacity}
      />

      {loadingProduct && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingText}>Looking up product...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BarcodeScannerScreen;