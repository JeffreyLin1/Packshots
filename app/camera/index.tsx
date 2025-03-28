import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  FlatList,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PackingList } from '../../components/ListModal';
import { useAuth } from '../../lib/AuthContext';
import * as Location from 'expo-location';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Define the DetectedObject type
type DetectedObject = {
  name: string;
  score?: number;
  confidence?: number;
  selected?: boolean;
};

export default function CameraScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [list, setList] = useState<PackingList | null>(null);
  const [comparisonResults, setComparisonResults] = useState<{
    found: string[];
    missing: string[];
  }>({ found: [], missing: [] });
  const [showResults, setShowResults] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [editableItems, setEditableItems] = useState<DetectedObject[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const [highConfidenceItems, setHighConfidenceItems] = useState<Array<{
    name: string;
    score: number;
    inList: boolean;
    matchedListItem: string | null;
    similarityScore: number;
  }>>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherSuggestions, setWeatherSuggestions] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<string>('');

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'You need to be signed in to use this feature.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    // Request camera permissions
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    
    if (listId) {
      loadList(listId);
    }

    // Fetch weather data
    fetchWeatherData();
  }, [listId, user]);

  const loadList = async (id: string) => {
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const foundList = savedLists.find(list => list.id === id);
        if (foundList) {
          setList(foundList);
        }
      }
    } catch (error) {
      console.error('Failed to load list:', error);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          setPhoto(photo.uri);
          setDetectedObjects([]);
          setShowResults(false);
        }
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const processImage = async () => {
    if (!photo || !list) return;
    
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
      
      console.log('Vision API response:', JSON.stringify(data));
      
      // Extract objects from the response
      let detectedItems: DetectedObject[] = [];
      
      if (data.objects && Array.isArray(data.objects)) {
        detectedItems = data.objects;
      } else if (data.labels && Array.isArray(data.labels)) {
        detectedItems = data.labels;
      } else if (Array.isArray(data)) {
        detectedItems = data;
      }
      
      console.log('Processed detected items:', JSON.stringify(detectedItems));
      
      // Make sure we're setting the detected objects correctly
      setDetectedObjects(detectedItems);
      
      // Compare detected objects with list items
      compareWithList(detectedItems);
    } catch (error) {
      console.error('Failed to process image:', error);
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
      setDetectedObjects([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateSimilarity = (listItem: string, detectedItem: string): number => {
    // Convert both to lowercase for case-insensitive comparison
    const listItemLower = listItem.toLowerCase();
    const detectedItemLower = detectedItem.toLowerCase();
    
    // Direct match
    if (listItemLower === detectedItemLower) return 1.0;
    
    // Check if one contains the other
    if (listItemLower.includes(detectedItemLower) || detectedItemLower.includes(listItemLower)) {
      // Calculate how much of the shorter string is contained in the longer one
      const shorterLength = Math.min(listItemLower.length, detectedItemLower.length);
      const longerLength = Math.max(listItemLower.length, detectedItemLower.length);
      return shorterLength / longerLength;
    }
    
    // Split into words and check for word-level matches
    const listWords = listItemLower.split(/\s+/);
    const detectedWords = detectedItemLower.split(/\s+/);
    
    // Count matching words
    let matchingWords = 0;
    for (const listWord of listWords) {
      for (const detectedWord of detectedWords) {
        if (listWord === detectedWord || 
            listWord.includes(detectedWord) || 
            detectedWord.includes(listWord)) {
          matchingWords++;
          break;
        }
      }
    }
    
    // Calculate similarity based on matching words
    const totalWords = Math.max(listWords.length, detectedWords.length);
    return matchingWords / totalWords;
  };

  const compareWithList = (detectedItems: DetectedObject[]) => {
    if (!list) return;
    
    console.log('Comparing with list:', list.items);
    
    // Get list item names
    const listItems = list.items.map(item => 
      typeof item === 'string' ? item : item.name
    );
    
    // Get detected item names with high confidence
    const confidenceItems = detectedItems
      .filter(item => {
        const confidenceValue = item.score || item.confidence || 0;
        return confidenceValue >= 0.5;
      })
      .map(item => ({
        name: item.name,
        score: item.score || item.confidence || 0.5,
        inList: false,
        matchedListItem: null as string | null,
        similarityScore: 0
      }));
    
    // Find best matches for each list item
    const matchedListItems = new Set<string>();
    const SIMILARITY_THRESHOLD = 0.6; // Minimum similarity to consider a match
    
    // For each list item, find the best matching detected item
    listItems.forEach(listItem => {
      let bestMatch = null;
      let bestSimilarity = 0;
      
      confidenceItems.forEach(detectedItem => {
        const similarity = calculateSimilarity(listItem, detectedItem.name);
        
        if (similarity > SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = detectedItem;
        }
      });
      
      if (bestMatch) {
        bestMatch.inList = true;
        bestMatch.matchedListItem = listItem;
        bestMatch.similarityScore = bestSimilarity;
        matchedListItems.add(listItem);
      }
    });
    
    // Find items that are in the list but not detected in the photo
    const missingItems = listItems.filter(item => !matchedListItems.has(item));
    
    // Update state with results
    setDetectedObjects(detectedItems);
    setEditableItems(detectedItems.map(item => ({
      name: item.name,
      score: item.score || item.confidence || 0.5,
      selected: true
    })));
    
    // Update the highConfidenceItems state
    setHighConfidenceItems(confidenceItems);
    
    setComparisonResults({
      found: Array.from(matchedListItems),
      missing: missingItems
    });
    
    setShowResults(true);
    setIsEditing(true);
  };

  const addNewItem = () => {
    // Create a new item with a placeholder name
    const newItem = {
      name: "New Item",
      score: 1.0,
      selected: true
    };
    
    setEditableItems([...editableItems, newItem]);
    updateMissingItems();
  };

  const updateItemName = (index: number, newName: string) => {
    const updatedItems = [...editableItems];
    updatedItems[index] = {
      ...updatedItems[index],
      name: newName
    };
    setEditableItems(updatedItems);
    updateMissingItems();
  };

  const toggleItemSelection = (index: number) => {
    const updatedItems = [...editableItems];
    updatedItems[index] = {
      ...updatedItems[index],
      selected: !updatedItems[index].selected
    };
    setEditableItems(updatedItems);
    updateMissingItems();
  };

  const removeItem = (index: number) => {
    const updatedItems = [...editableItems];
    updatedItems.splice(index, 1);
    setEditableItems(updatedItems);
    updateMissingItems();
  };

  const updateListWithFoundItems = async () => {
    if (!list || !listId) return;
    
    try {
      // Get selected items
      const selectedItems = editableItems
        .filter(item => item.selected)
        .map(item => item.name);
      
      // Get all lists
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (!savedListsJson) return;
      
      const savedLists = JSON.parse(savedListsJson) as PackingList[];
      
      // Find and update the current list
      const updatedLists = savedLists.map(savedList => {
        if (savedList.id === listId) {
          // Update packed status for selected items
          const updatedItems = savedList.items.map(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            if (selectedItems.some(selected => 
              selected.toLowerCase().includes(itemName.toLowerCase()) || 
              itemName.toLowerCase().includes(selected.toLowerCase())
            )) {
              return typeof item === 'string' 
                ? { id: Math.random().toString(36).substring(2, 9), name: item, packed: true }
                : { ...item, packed: true };
            }
            return item;
          });
          
          return { ...savedList, items: updatedItems };
        }
        return savedList;
      });
      
      // Save updated lists
      await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
      
      Alert.alert(
        'Success', 
        'Your packing list has been updated!',
        [
          {
            text: 'View List',
            onPress: () => goToListDetails(listId)
          },
          {
            text: 'Take Another Photo',
            onPress: () => {
              setPhoto(null);
              setShowResults(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to update list:', error);
      Alert.alert('Error', 'Failed to update your list. Please try again.');
    }
  };

  const goToListDetails = (id: string) => {
    router.push({
      pathname: '/list-details/[id]',
      params: { id }
    });
  };

  const goBack = () => {
    if (listId) {
      goToListDetails(listId);
    } else {
      router.back();
    }
  };

  const fetchWeatherData = async (showStatus = false) => {
    try {
      if (showStatus) setWeatherStatus('Requesting location permission...');
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        if (showStatus) setWeatherStatus('Location permission denied');
        return;
      }
      
      if (showStatus) setWeatherStatus('Getting current location...');
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Use your API key directly
      const apiKey = '8dc5907fdc10027ab6b41a7221ea06a6';
      
      if (showStatus) setWeatherStatus(`Fetching weather data...`);
      
      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
      );
      const currentWeather = await weatherResponse.json();
      
      if (currentWeather.cod && currentWeather.cod !== 200) {
        if (showStatus) setWeatherStatus(`Weather API error: ${currentWeather.message || 'Unknown error'}`);
        return;
      }
      
      // Fetch forecast for rain prediction - removed the status message here
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
      );
      const forecast = await forecastResponse.json();
      
      if (forecast.cod && forecast.cod !== '200') {
        if (showStatus) setWeatherStatus(`Forecast API error: ${forecast.message || 'Unknown error'}`);
        return;
      }
      
      // The API response structure is different than what we expected
      // Let's adjust our data structure to match the actual API response
      const combinedWeatherData = {
        current: currentWeather,
        forecast: forecast
      };
      
      setWeatherData(combinedWeatherData);
      if (showStatus) setWeatherStatus('');
      
      // Generate suggestions based on weather
      generateWeatherSuggestions(combinedWeatherData);
      
    } catch (error) {
      setWeatherStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateWeatherSuggestions = (data: any) => {
    const suggestions: string[] = [];
    
    // More thorough validation of the data structure
    if (!data || !data.current || !data.current.main || !data.current.weather || 
        !data.current.weather[0] || typeof data.current.main.temp === 'undefined') {
      console.log('Weather data is incomplete:', data);
      return;
    }
    
    const currentTemp = data.current.main.temp;
    const currentWeather = data.current.weather[0];
    const weatherId = currentWeather.id;
    
    // Temperature-based suggestions
    if (currentTemp < 10) {
      suggestions.push(`It's ${Math.round(currentTemp)}°C out right now. Make sure you're wearing something warm!`);
    } else if (currentTemp < 20) {
      suggestions.push(`It's ${Math.round(currentTemp)}°C out right now. A light jacket might be a good idea.`);
    } else if (currentTemp >= 30) {
      suggestions.push(`It's ${Math.round(currentTemp)}°C out right now. Don't forget sunscreen and a hat!`);
    }
    
    // Current weather condition suggestions
    if (weatherId >= 200 && weatherId < 300) {
      suggestions.push('There\'s a thunderstorm right now! You should bring an umbrella and stay indoors if possible.');
    } else if (weatherId >= 300 && weatherId < 600) {
      suggestions.push('It\'s currently raining. Don\'t forget your umbrella!');
    } else if (weatherId >= 600 && weatherId < 700) {
      suggestions.push('It\'s snowing! Make sure you have warm boots and a heavy coat.');
    } else if (weatherId >= 700 && weatherId < 800) {
      suggestions.push('There\'s reduced visibility due to fog, mist, or dust. Be careful if you\'re driving.');
    }
    
    // Forecast-based suggestions (for rain)
    if (data.forecast && data.forecast.list && Array.isArray(data.forecast.list)) {
      const next24Hours = data.forecast.list.slice(0, 8); // 3-hour intervals for 24 hours
      const rainForecast = next24Hours.find(item => 
        item && item.weather && item.weather[0] && 
        item.weather[0].id >= 300 && item.weather[0].id < 600
      );
      
      if (rainForecast && typeof rainForecast.pop !== 'undefined') {
        const timeUntilRain = Math.round((new Date(rainForecast.dt * 1000).getTime() - Date.now()) / (1000 * 60 * 60));
        const rainProbability = Math.round(rainForecast.pop * 100); // probability of precipitation
        
        if (timeUntilRain <= 12 && rainProbability > 30) {
          suggestions.push(`You should bring an umbrella. There's a ${rainProbability}% chance it will rain in about ${timeUntilRain} hours.`);
        }
      }
    }
    
    setWeatherSuggestions(suggestions);
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
            onPress={goBack}
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
        ) : showResults ? (
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.resultsContainer}>
              <Image source={{ uri: photo }} style={styles.previewImageSmall} />
              
              <Text style={styles.resultsTitle}>
                Items Detected in Photo:
                <TouchableOpacity 
                  onPress={() => setIsEditing(!isEditing)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>
                    {isEditing ? "Done" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </Text>
              
              {detectedObjects && detectedObjects.length > 0 && (
                <>
                  <Text style={styles.resultsTitle}>Detected Items:</Text>
                  <View style={styles.itemsContainer}>
                    <FlatList
                      data={editableItems}
                      keyExtractor={(item, index) => `detected-${index}`}
                      renderItem={({ item, index }) => {
                        const matchInfo = highConfidenceItems.find(i => i.name === item.name);
                        const isInList = matchInfo?.inList;
                        const matchedItem = matchInfo?.matchedListItem;
                        
                        return (
                          <View style={styles.itemRow}>
                            {isEditing ? (
                              <>
                                <TouchableOpacity onPress={() => toggleItemSelection(index)}>
                                  <Ionicons 
                                    name={item.selected ? "checkbox" : "square-outline"} 
                                    size={24} 
                                    color="#5D4FB7" 
                                  />
                                </TouchableOpacity>
                                <TextInput
                                  style={styles.itemTextInput}
                                  value={item.name}
                                  onChangeText={(text) => updateItemName(index, text)}
                                />
                                <TouchableOpacity onPress={() => removeItem(index)}>
                                  <Ionicons name="trash-outline" size={24} color="#F44336" />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <Ionicons 
                                  name={isInList ? "checkmark-circle" : "add-circle-outline"} 
                                  size={24} 
                                  color={isInList ? "#4CAF50" : "#5D4FB7"} 
                                />
                                <View style={styles.itemTextContainer}>
                                  <Text style={styles.itemText}>{item.name}</Text>
                                  {isInList && matchedItem && (
                                    <Text style={styles.matchedItemText}>
                                      Matched: {matchedItem}
                                    </Text>
                                  )}
                                </View>
                                <Text style={styles.itemScore}>{Math.round(item.score * 100)}%</Text>
                              </>
                            )}
                          </View>
                        );
                      }}
                      style={styles.itemsList}
                      contentContainerStyle={{ paddingBottom: 10 }}
                    />
                  </View>
                </>
              )}
              
              {comparisonResults.missing && comparisonResults.missing.length > 0 && (
                <>
                  <Text style={styles.resultsTitle}>You are missing:</Text>
                  <View style={styles.itemsContainer}>
                    <FlatList
                      data={comparisonResults.missing}
                      keyExtractor={(item, index) => `missing-${index}`}
                      renderItem={({ item }) => (
                        <View style={styles.itemRow}>
                          <Ionicons name="close-circle" size={24} color="#F44336" />
                          <Text style={styles.itemText}>{item}</Text>
                        </View>
                      )}
                      style={styles.itemsList}
                    />
                  </View>
                </>
              )}

              {weatherSuggestions.length > 0 && (
                <View style={styles.weatherSuggestionsContainer}>
                  {weatherSuggestions.map((suggestion, index) => (
                    <View key={`weather-${index}`} style={styles.suggestionItem}>
                      <Ionicons name="cloudy" size={24} color="#5D4FB7" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
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

        {weatherStatus && (
          <View style={styles.weatherStatusContainer}>
            <Text style={styles.weatherStatusText}>{weatherStatus}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Main camera screen with live preview
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {list ? `Check Items for ${list.title}` : 'Take a Photo'}
        </Text>
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
    justifyContent: 'center',
  },
  processingText: {
    fontSize: 18,
    color: '#4A3C2C',
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
  // New styles for results view
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginTop: 10,
    marginBottom: 10,
  },
  itemsContainer: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    maxHeight: 200,
    minHeight: 100,
  },
  itemsList: {
    flex: 1,
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD6',
    width: '100%',
  },
  itemText: {
    fontSize: 16,
    color: '#4A3C2C',
    marginLeft: 10,
  },
  itemScore: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 'auto',
  },
  noItemsText: {
    fontSize: 16,
    color: '#8B7355',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  resultsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  editButton: {
    marginLeft: 'auto',
    backgroundColor: '#5D4FB7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  itemTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A3C2C',
    marginLeft: 10,
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#D2B48C',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EAD6',
  },
  addItemText: {
    fontSize: 16,
    color: '#5D4FB7',
    marginLeft: 8,
    fontWeight: '600',
  },
  matchedItemText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  weatherSuggestionsContainer: {
    backgroundColor: '#F0EAD6',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4A3C2C',
    flex: 1,
  },
  weatherStatusContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 100,
  },
  weatherStatusText: {
    color: 'white',
    fontSize: 14,
  },
});
