import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import ObjectsList, { DetectedObject } from '../../components/ObjectsList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PackingList } from '../../components/ListModal';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          setPhoto(photo.uri);
          setDetectedObjects([]);
        }
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const processImage = async () => {
    if (!photo) return;
    
    setIsProcessing(true);
    
    try {
      // Read the image file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(photo, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('vision-api', {
        body: { imageBase64: `data:image/jpeg;base64,${base64}` },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update state with detected objects
      setDetectedObjects(data.objects || []);
    } catch (error) {
      console.error('Failed to process image:', error);
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
      setDetectedObjects([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const createPackingList = async (items: string[]) => {
    try {
      // Create new list object
      const newList: PackingList = {
        id: Math.random().toString(36).substring(2, 9),
        title: `Photo List ${new Date().toLocaleDateString()}`,
        items: items.map(name => ({
          id: Math.random().toString(36).substring(2, 9),
          name,
          packed: false
        })),
        icon: 'camera-outline',
        createdAt: Date.now()
      };
      
      // Get existing lists or initialize empty array
      const existingListsJson = await AsyncStorage.getItem('packingLists');
      const existingLists: PackingList[] = existingListsJson 
        ? JSON.parse(existingListsJson) 
        : [];
      
      // Add new list and save back to storage
      const updatedLists = [newList, ...existingLists];
      await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
      
      Alert.alert(
        'Success', 
        'Your packing list has been created!',
        [
          {
            text: 'View List',
            onPress: () => router.push({
              pathname: '/check-list/[id]',
              params: { id: newList.id }
            })
          },
          {
            text: 'Go Home',
            onPress: goToHome
          }
        ]
      );
    } catch (error) {
      console.error('Failed to create list:', error);
      Alert.alert('Error', 'Failed to create your list. Please try again.');
    }
  };

  const goToHome = () => {
    router.replace('/');
  };

  // If permission is not granted yet
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If permission is denied
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-outline" size={48} color="#8B7355" />
          <Text style={styles.errorText}>Camera access denied</Text>
          <Text style={styles.errorSubtext}>
            Please enable camera access in your device settings to use this feature.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={goToHome}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If photo is taken, show preview
  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPhoto(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Photo Preview</Text>
        </View>
        
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <Image source={{ uri: photo }} style={styles.previewImageSmall} />
            <ActivityIndicator size="large" color="#5D4FB7" style={styles.loader} />
            <Text style={styles.processingText}>Analyzing image...</Text>
          </View>
        ) : detectedObjects.length > 0 ? (
          <ObjectsList 
            objects={detectedObjects} 
            onCreateList={createPackingList}
          />
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photo }} style={styles.previewImage} />
            
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.discardButton]}
                onPress={() => setPhoto(null)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.useButton]}
                onPress={processImage}
              >
                <Ionicons name="search" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Analyze</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Main camera screen with live preview
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take a Photo</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={takePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#E8DBC5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#5D4FB7',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginTop: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewImageSmall: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#E8DBC5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  discardButton: {
    backgroundColor: '#E57373',
  },
  useButton: {
    backgroundColor: '#5D4FB7',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#4A3C2C',
    textAlign: 'center',
  },
});
