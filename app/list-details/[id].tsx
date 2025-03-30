import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { PackingList, ListItem } from '../../components/ListModal';
import TabBar from '../../components/TabBar';
import { useAuth } from '../../lib/AuthContext';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

export default function ListDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<PackingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [manualStop, setManualStop] = useState(false);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<ListItem[]>([]);

  useEffect(() => {
    loadList();
    
    // Initialize voice recognition
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = onSpeechEnd;
    
    return () => {
      // Clean up voice recognition
      Voice.destroy().then(() => {
        console.log('Voice destroyed');
      });
    };
  }, [id]);

  // Calculate progress whenever items change
  useEffect(() => {
    if (list && list.items.length > 0) {
      const packedCount = list.items.filter(item => 
        typeof item === 'string' ? false : item.packed
      ).length;
      const newProgress = Math.round((packedCount / list.items.length) * 100);
      setProgress(newProgress);
      
      // Animate the progress bar
      Animated.timing(progressAnim, {
        toValue: newProgress,
        duration: 500,
        useNativeDriver: false
      }).start();
    } else {
      setProgress(0);
      progressAnim.setValue(0);
    }
  }, [list]);
  
  // Process recognized text to check items
  useEffect(() => {
    if (recognizedText && list) {
      processVoiceInput(recognizedText);
    }
  }, [recognizedText]);

  const loadList = async () => {
    setIsLoading(true);
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const foundList = savedLists.find(list => list.id === id);
        if (foundList) {
          // Ensure all items have the correct structure
          const normalizedItems = foundList.items.map(item => {
            if (typeof item === 'string') {
              return {
                id: Math.random().toString(36).substring(2, 9),
                name: item,
                packed: false
              };
            }
            return item;
          });
          
          const updatedList = {
            ...foundList,
            items: normalizedItems
          };
          
          setList(updatedList);
          setEditedItems(normalizedItems);
        } else {
          Alert.alert('Error', 'List not found');
          router.back();
        }
      } else {
        Alert.alert('Error', 'No lists found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load list:', error);
      Alert.alert('Error', 'Failed to load the list');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemPacked = async (itemId: string) => {
    if (!list || isEditMode) return;
    
    try {
      // Update the item in the current list
      const updatedItems = list.items.map(item => 
        item.id === itemId ? { ...item, packed: !item.packed } : item
      );
      
      const updatedList = {
        ...list,
        items: updatedItems
      };
      
      // Update the list in storage
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const updatedLists = savedLists.map(l => 
          l.id === list.id ? updatedList : l
        );
        
        await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
        setList(updatedList);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      Alert.alert('Error', 'Failed to update item status.');
    }
  };
  
  // Voice recognition handlers
  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setRecognizedText(e.value[0]);
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    
    // Check for "no speech detected" error with the correct error object structure
    const noSpeechError = 
      e.error?.message?.includes('no speech') || 
      e.error?.code === 'recognition_fail' || 
      (typeof e === 'object' && e.error?.message?.includes('1110/No speech detected'));
    
    // Only show error if it wasn't a manual stop and not a "no speech detected" error
    if (!manualStop && !noSpeechError) {
      Alert.alert('Voice Recognition Error', 'There was a problem with voice recognition. Please try again.');
    }
    
    // Reset manual stop flag
    setManualStop(false);
    stopListening();
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  // Toggle voice recognition
  const toggleVoiceRecognition = async () => {
    if (isListening) {
      // Set manual stop flag to true when user manually stops listening
      setManualStop(true);
      await stopListening();
    } else {
      await startListening();
    }
  };

  // Start voice recognition
  const startListening = async () => {
    try {
      setManualStop(false); // Reset manual stop flag
      await Voice.start('en-US');
      setIsListening(true);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Error', 'Could not start voice recognition. Please try again.');
    }
  };

  // Stop voice recognition
  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Process voice input to check items
  const processVoiceInput = async (text: string) => {
    if (!list) return;
    
    const lowerText = text.toLowerCase();
    let itemsChecked = false;
    
    // Check if any item names are mentioned in the recognized text
    const updatedItems = list.items.map(item => {
      const itemName = item.name.toLowerCase();
      
      // If the item name is in the recognized text and not already packed, mark it as packed
      if (lowerText.includes(itemName) && !item.packed) {
        itemsChecked = true;
        return { ...item, packed: true };
      }
      return item;
    });
    
    if (itemsChecked) {
      // Update the list with the newly checked items
      const updatedList = {
        ...list,
        items: updatedItems
      };
      
      // Save to AsyncStorage
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const updatedLists = savedLists.map(l => 
          l.id === list.id ? updatedList : l
        );
        
        await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
        setList(updatedList);
      }
    }
  };

  // Edit mode functions
  const toggleEditMode = () => {
    if (isEditMode) {
      // Save changes when exiting edit mode
      saveChanges();
    } else {
      // Enter edit mode
      setIsEditMode(true);
      if (list) {
        setEditedItems([...list.items]);
      }
    }
  };

  const updateItemName = (id: string, newName: string) => {
    setEditedItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, name: newName } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setEditedItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const saveChanges = async () => {
    if (!list) return;
    
    try {
      // Filter out empty items
      const filteredItems = editedItems.filter(item => item.name.trim() !== '');
      
      const updatedList = {
        ...list,
        items: filteredItems
      };
      
      // Update the list in storage
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const updatedLists = savedLists.map(l => 
          l.id === list.id ? updatedList : l
        );
        
        await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
        setList(updatedList);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      Alert.alert('Error', 'Failed to save your changes.');
    }
  };

  const goToCamera = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to use the camera feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => router.push('/auth/sign-in')
          }
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/camera',
      params: { listId: id }
    });
  };

  const goBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D4FB7" />
          <Text style={styles.loadingText}>Loading your list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#8B7355" />
          <Text style={styles.errorText}>Could not load the list.</Text>
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.title}</Text>
        <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
          <Ionicons 
            name={isEditMode ? "checkmark" : "pencil"} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }) 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}% Packed</Text>
        </View>
        
        {!isEditMode && (
          <View style={styles.actionsWrapper}>
            <Text style={styles.actionsLabel}>Check items off or use:</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={goToCamera}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, isListening && styles.listeningButton]}
                onPress={toggleVoiceRecognition}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name={isListening ? "mic" : "mic-outline"} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.voiceTextContainer}>
                  <Text style={styles.actionButtonText}>
                    {isListening ? "Listening..." : "Voice"}
                  </Text>
                  {isListening && (
                    <Text style={styles.tapToStopText}>Tap to stop</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <FlatList
          data={isEditMode ? editedItems : list.items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            isEditMode ? (
              <View style={styles.itemRow}>
                <TextInput
                  style={styles.itemInput}
                  value={item.name}
                  onChangeText={(text) => updateItemName(item.id, text)}
                  placeholder="Enter item name"
                  autoCapitalize="sentences"
                />
                <TouchableOpacity 
                  style={styles.deleteItemButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#E57373" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.itemRow}
                onPress={() => toggleItemPacked(item.id)}
              >
                <View style={[
                  styles.checkboxContainer,
                  item.packed && styles.checkedContainer
                ]}>
                  {item.packed && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[
                  styles.itemText,
                  item.packed && styles.checkedItemText
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>
      
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4E3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DBC5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5D4FB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E8DBC5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5D4FB7',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'right',
  },
  actionsWrapper: {
    marginBottom: 16,
  },
  actionsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A3C2C',
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
    flex: 0.48,
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listeningButton: {
    backgroundColor: '#F0EAD6',
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5D4FB7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voiceTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3C2C',
  },
  tapToStopText: {
    fontSize: 11,
    color: '#8B7355',
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DBC5',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B7355',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedContainer: {
    backgroundColor: '#5D4FB7',
    borderColor: '#5D4FB7',
  },
  itemText: {
    fontSize: 16,
    color: '#4A3C2C',
    flex: 1,
  },
  itemInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A3C2C',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  checkedItemText: {
    textDecorationLine: 'line-through',
    color: '#8B7355',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
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
    color: '#8B7355',
    marginTop: 12,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#5D4FB7',
    fontWeight: '600',
  },
  deleteItemButton: {
    padding: 8,
  },
});
