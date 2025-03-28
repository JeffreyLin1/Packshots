import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define types
export type ListItem = {
  id: string;
  name: string;
  packed: boolean;
};

export type PackingList = {
  id: string;
  title: string;
  items: ListItem[];
  icon: string;
  createdAt: number;
};

type ListModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (list: Omit<PackingList, 'id' | 'createdAt'>) => void;
  initialList?: PackingList;
};

const ListModal: React.FC<ListModalProps> = ({
  visible,
  onClose,
  onSave,
  initialList
}) => {
  // Animation value
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  // State for form fields
  const [title, setTitle] = useState(initialList?.title || '');
  const [items, setItems] = useState<ListItem[]>(initialList?.items || []);
  const [isClosing, setIsClosing] = useState(false);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  
  // Ref for the newly added item's input
  const newItemInputRef = useRef<TextInput | null>(null);

  // Handle animation when visibility changes
  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  }, [visible, scaleAnim]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onClose();
      setIsClosing(false);
    });
  };

  // Add a new blank item to the list
  const addNewItem = () => {
    const newItemId = Math.random().toString(36).substring(2, 9);
    
    const newItem: ListItem = {
      id: newItemId,
      name: '',
      packed: false
    };
    
    setItems([...items, newItem]);
    setFocusItemId(newItemId);
  };

  // Remove an item from the list
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Update item name
  const updateItemName = (id: string, newName: string) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, name: newName } 
        : item
    ));
  };

  // Handle save button press
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your list.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item to your list.');
      return;
    }

    // Filter out any items with empty names
    const validItems = items.filter(item => item.name.trim() !== '');
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one valid item to your list.');
      return;
    }

    setIsClosing(true);
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onSave({
        title: title.trim(),
        items: validItems,
        icon: 'list-outline' // Default icon
      });

      // Reset form
      setTitle('');
      setItems([]);
      setIsClosing(false);
    });
  };

  // Calculate the scale interpolation for the animation
  const modalScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  return (
    <Modal
      transparent={true}
      visible={visible || isClosing}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ scale: modalScale }],
              opacity: scaleAnim
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={initialList ? "Edit list title..." : "Enter list title..."}
              placeholderTextColor="#8B7355"
            />
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#4A3C2C" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
            {/* Items List */}
            {items.length > 0 ? (
              <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.itemRow}>
                    <TextInput
                      style={styles.itemInput}
                      value={item.name}
                      onChangeText={(text) => updateItemName(item.id, text)}
                      placeholder="Item name"
                      placeholderTextColor="#8B7355"
                      autoFocus={focusItemId === item.id}
                      onFocus={() => setFocusItemId(item.id)}
                      ref={focusItemId === item.id ? newItemInputRef : null}
                    />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#E57373" />
                    </TouchableOpacity>
                  </View>
                )}
                scrollEnabled={false}
                style={styles.itemsList}
              />
            ) : (
              <View style={styles.emptyItemsContainer}>
                <Text style={styles.emptyItemsText}>No items added yet</Text>
              </View>
            )}
            
            {/* Add Item Button */}
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={addNewItem}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {initialList ? 'Update List' : 'Save List'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#F5F5DC',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
    marginLeft: 10,
  },
  scrollContainer: {
    marginBottom: 10,
  },
  titleInput: {
    flex: 1,
    backgroundColor: '#F0EAD6',
    borderWidth: 0,
    borderBottomWidth: 2,
    borderColor: '#5D4FB7',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3C2C',
  },
  itemsList: {
    marginBottom: 10,
  },
  emptyItemsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyItemsText: {
    color: '#8B7355',
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#F8F4E3',
    borderWidth: 1,
    borderColor: '#E8DBC5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#4A3C2C',
    marginRight: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4E3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D4FB7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#5D4FB7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ListModal;
