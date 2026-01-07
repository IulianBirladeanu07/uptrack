// screens/BarcodeScannerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from './BarcodeScannerScreenStyle';
import { useBarcodeScanner } from '../../helpers/useBarcodeScanner';
import { productCache } from '../../utils/productCache';

const ScannerOverlay = ({ 
  isScanning, 
  scanLineAnimation, 
  instructionsVisible,
  successOpacity,
  errorOpacity
}) => {
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

const BarcodeScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [barcodedProducts, setBarcodedProducts] = useState([]);
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(true);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  
  const route = useRoute();
  const { selectedDate, meal } = route.params;

  console.log('meal in scanner: ', meal);
  const {
    scannedProducts,
    isScanning,
    loadingProduct,
    currentProduct,
    batchMode,
    instructionsVisible,
    successOpacity,
    errorOpacity,
    handleBarcodeScanned,
    resumeScanning,
    toggleBatchMode,
    handleBatchScanComplete,
  } = useBarcodeScanner(barcodedProducts, navigation, meal, selectedDate);

  // Modified to navigate directly to FoodDetail when a product is scanned
  useEffect(() => {
    if (currentProduct && !isScanning && !batchMode) {
      navigation.navigate('FoodDetail', { 
        food: currentProduct, 
        meal, 
        selectedDate 
      });
    }
  }, [currentProduct, isScanning, batchMode, navigation, meal, selectedDate]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      resumeScanning();
    });

    return unsubscribe;
  }, [navigation, resumeScanning]);

  useEffect(() => {
    const loadBarcodedProducts = async () => {
      try {
        setIsLoadingDatabase(true);
        const products = await productCache.getProducts();
        setBarcodedProducts(products);
      } catch (error) {
        console.error('Failed to load barcoded products', error);
        Alert.alert(
          'Database Error',
          'Failed to load product database. Some features may not work properly.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoadingDatabase(false);
      }
    };

    loadBarcodedProducts();
  }, []);

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
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const closeScanner = () => {
    if (batchMode && scannedProducts.length > 0) {
      Alert.alert(
        'Complete Batch Scan?',
        'You have products in your batch. Would you like to view them before exiting?',
        [
          {
            text: 'View Products',
            onPress: () => {
              navigation.navigate('BatchScanResults', { 
                products: scannedProducts,
                meal,
                selectedDate 
              });
            }
          },
          {
            text: 'Exit Anyway',
            onPress: () => {
              if (navigation && navigation.goBack) {
                navigation.goBack();
              }
            },
            style: 'destructive'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      if (navigation && navigation.goBack) {
        navigation.goBack();
      }
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
          onPress={() => Camera.requestCameraPermissionsAsync()}
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
      {isLoadingDatabase && (
        <View style={styles.databaseLoadingContainer}>
          <Text style={styles.databaseLoadingText}>Loading product database...</Text>
        </View>
      )}

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
          flashMode={'off'}
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

      {isScanning && (
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              batchMode ? styles.activeModeButton : {}
            ]}
            onPress={toggleBatchMode}
          >
            <Ionicons 
              name={batchMode ? "layers" : "scan-outline"} 
              size={24} 
              color="white" 
            />
            {batchMode && (
              <View style={styles.batchCounter}>
                <Text style={styles.batchCounterText}>{scannedProducts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Batch Mode Indicator */}
      {isScanning && batchMode && (
        <View style={styles.batchModeIndicator}>
          <Text style={styles.batchModeText}>
            Batch Mode: {scannedProducts.length} item{scannedProducts.length !== 1 ? 's' : ''} scanned
          </Text>
          <Text style={styles.batchModeSubtext}>
            Scan multiple items consecutively
          </Text>
        </View>
      )}

      {/* Done Button for Batch Mode */}
      {isScanning && batchMode && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleBatchScanComplete}
        >
          <Text style={styles.doneButtonText}>Done ({scannedProducts.length})</Text>
          <Ionicons name="checkmark-circle" size={20} color="white" />
        </TouchableOpacity>
      )}

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