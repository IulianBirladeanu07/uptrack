import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking, Alert, ActivityIndicator, NativeModules } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles from './BarcodeScannerScreenStyle';
import { useBarcodeScanner } from '../../helpers/useBarcodeScanner';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import { parseNutritionLabel } from '../../utils/nutritionLabelOcr';

type TextRecognitionModule = {
  recognize: (imageURL: string, script: 'Latin') => Promise<{ text: string }>;
};

const textRecognitionModule = NativeModules['TextRecognition'] as TextRecognitionModule | undefined;

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
  const [isReadingLabel, setIsReadingLabel] = useState(false);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);
  
  const route = useAppRoute<'BarcodeScanner'>();
  const selectedDate = route.params?.selectedDate;
  const meal = route.params?.meal;
  const barcode = route.params?.barcode;
  const isNutritionLabelMode = route.params?.mode === 'nutritionLabel';

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
    if (isScanning && !isNutritionLabelMode) {
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
  }, [isNutritionLabelMode, isScanning, scanLineAnimation]);

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

  const openManualFoodEntry = () => {
    navigation.navigate('CustomFood', {
      barcode: barcode ?? '',
      type: 'foodWithBarcode',
      meal,
      selectedDate,
    });
  };

  const captureNutritionLabel = async () => {
    if (!cameraRef.current || isReadingLabel) return;
    if (!textRecognitionModule) {
      Alert.alert(
        'Scanner unavailable',
        'Nutrition label scanning is not available in this app build. Update the app or enter the food manually.',
        [{ text: 'Enter Manually', onPress: openManualFoodEntry }, { text: 'Cancel', style: 'cancel' }],
      );
      return;
    }

    setIsReadingLabel(true);
    try {
      const image = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!image.uri) throw new Error('Captured image has no local URI');

      const result = await textRecognitionModule.recognize(image.uri, 'Latin');
      const parsed = parseNutritionLabel(result.text);
      if (!parsed) {
        Alert.alert(
          'Nutrition facts not found',
          'Try another photo with the nutrition panel in focus, or enter the food manually.',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Enter Manually', onPress: openManualFoodEntry },
          ],
        );
        return;
      }

      navigation.navigate('CustomFood', {
        type: 'foodWithBarcode',
        barcode: barcode ?? '',
        meal,
        selectedDate,
        nutritionLabelValues: {
          ...parsed.fields,
          amount: parsed.amount,
          unit: parsed.unit,
        },
      });
    } catch (error) {
      console.error('Failed to scan nutrition label:', error);
      Alert.alert(
        'Label scan failed',
        'Could not read the photo. Try again or enter the food manually.',
        [
          { text: 'Try Again', style: 'cancel' },
          { text: 'Enter Manually', onPress: openManualFoodEntry },
        ],
      );
    } finally {
      setIsReadingLabel(false);
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
      {!isNutritionLabelMode && !isScanning && (
        <View style={styles.header}>
          <TouchableOpacity onPress={closeScanner} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {(isScanning || isNutritionLabelMode) && (
        <CameraView
          ref={cameraRef}
          onBarcodeScanned={!isNutritionLabelMode && isScanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['aztec', 'ean13', 'ean8', 'qr', 'pdf417', 'upc_e', 'datamatrix', 'code39', 'code93', 'itf14', 'codabar', 'code128', 'upc_a']
          }}
          style={StyleSheet.absoluteFillObject}
          zoom={0}
        />
      )}

      {isScanning && !isNutritionLabelMode && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeScanner}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      )}

      {isNutritionLabelMode ? (
        <View style={styles.labelScanOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.labelCloseButton} onPress={closeScanner} accessibilityRole="button" accessibilityLabel="Close label scanner">
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.labelScanInstructions}>
            <Text style={styles.labelScanTitle}>Scan nutrition label</Text>
            <Text style={styles.labelScanText}>Fit the nutrition facts panel inside the frame.</Text>
          </View>
          <View style={styles.labelScanFrame} />
          <View style={styles.labelScanFooter}>
            <TouchableOpacity
              style={[styles.captureButton, isReadingLabel && styles.captureButtonDisabled]}
              onPress={captureNutritionLabel}
              disabled={isReadingLabel}
              accessibilityRole="button"
              accessibilityLabel="Take nutrition label photo"
            >
              {isReadingLabel
                ? <ActivityIndicator color="#111" />
                : <Ionicons name="camera" size={30} color="#111" />}
            </TouchableOpacity>
            <Text style={styles.labelScanText}>
              {isReadingLabel ? 'Reading label...' : 'Take photo to fill in the form'}
            </Text>
          </View>
        </View>
      ) : (
        <ScannerOverlay
          isScanning={isScanning}
          scanLineAnimation={scanLineAnimation}
          instructionsVisible={instructionsVisible}
          successOpacity={successOpacity}
          errorOpacity={errorOpacity}
        />
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