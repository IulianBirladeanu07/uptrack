import { useState, useRef, useCallback } from 'react';
import { Vibration, Alert } from 'react-native';
import { Animated } from 'react-native';
import type { BarcodeScanningResult } from 'expo-camera';
import { transformBarcodeDBToFoodDetail } from '../utils/customFoodDataUtils';
import type { AppNavigationProp } from '../../../shared/navigation';
import { supabase } from '../../../shared/services/supabaseClient';
import { BarcodeScanGuard } from '../utils/barcodeScanGuard';

export const useBarcodeScanner = (
  navigation: AppNavigationProp,
  meal: string | undefined,
  selectedDate: string | undefined
) => {
  const [isScanning, setIsScanning] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanGuardRef = useRef(new BarcodeScanGuard());

  const findProductByBarcode = async (barcode: string) => {
    const { data: product, error } = await supabase
      .from('barcoded_products')
      .select('*')
      .eq('barcode_id', barcode)
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return product;
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (lastScannedRef.current === data && scanTimeoutRef.current) {
      return;
    }
    if (!scanGuardRef.current.acquire()) return;

    lastScannedRef.current = data;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      lastScannedRef.current = null;
    }, 3000);

    Vibration.vibrate(100);
    setIsScanning(false);
    setLoadingProduct(true);

    try {
      const product = await findProductByBarcode(data);
      if (product) {
        showSuccessAnimation();
        const transformedProduct = transformBarcodeDBToFoodDetail(product);

        navigation.navigate('FoodDetail', { 
          food: transformedProduct, 
          meal, 
          selectedDate
        });

        if (instructionsVisible) {
          setInstructionsVisible(false);
        }
      } else {
        showErrorAnimation();
        handleProductNotFound(data);
      }
    } catch (error) {
      console.error('Error scanning barcode', error);
      Alert.alert('Scan Error', 'Something went wrong while processing the barcode.');
      setIsScanning(true);
    } finally {
      scanGuardRef.current.release();
      setLoadingProduct(false);
    }
  };

  const showSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showErrorAnimation = () => {
    Animated.sequence([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleProductNotFound = (barcode: string) => {
    Alert.alert(
      'Product Not Found',
      `No product found with barcode: ${barcode}`,
      [
        {
          text: 'Create Custom Food',
          onPress: () => {
            navigation.navigate('CustomFood', {
              barcode,
              type: 'foodWithBarcode',
              meal,
              selectedDate
            });
          }
        },
        {
          text: 'Try Again',
          onPress: () => {
            setIsScanning(true);
          }
        }
      ],
      {
        cancelable: true,
        onDismiss: () => {
          setIsScanning(true);
        }
      }
    );
  };

  const resumeScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  return {
    isScanning,
    loadingProduct,
    instructionsVisible,
    successOpacity,
    errorOpacity,
    handleBarcodeScanned,
    resumeScanning,
  };
};
