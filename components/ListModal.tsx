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
  Animated
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
  const [newItemText, setNewItemText] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(initialList?.icon || 'sunny-outline');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Handle animation when visibility changes
  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      // Reset to initial scale
      scaleAnim.setValue(0);
      // Animate to full scale
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

  // Icon selection options
  const iconOptions = [
    'sunny-outline', 
    'snow-outline', 
    'briefcase-outline', 
    'airplane-outline',
    'boat-outline',
    'car-outline',
    'bicycle-outline',
    'bed-outline'
  ];

  // Add a new item to the list
  const addItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem: ListItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newItemText.trim(),
      packed: false
    };
    
    setItems([...items, newItem]);
    setNewItemText('');
  };

  // Remove an item from the list
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setNewItemText('');
    }
  };

  // Start editing an item
  const startEditItem = (id: string, currentName: string) => {
    setEditingItemId(id);
    setNewItemText(currentName);
  };

  // Save edited item
  const saveEditedItem = () => {
    if (!editingItemId || !newItemText.trim()) {
      setEditingItemId(null);
      setNewItemText('');
      return;
    }

    setItems(items.map(item => 
      item.id === editingItemId 
        ? { ...item, name: newItemText.trim() } 
        : item
    ));
    
    setEditingItemId(null);
    setNewItemText('');
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

    setIsClosing(true);
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onSave({
        title: title.trim(),
        items,
        icon: selectedIcon
      });

      // Reset form
      setTitle('');
      setItems([]);
      setNewItemText('');
      setSelectedIcon('sunny-outline');
      setIsClosing(false);
    });
  };

  // Render item in the list
  const renderItem = ({ item }: { item: ListItem }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.name}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.itemButton}
          onPress={() => startEditItem(item.id, item.name)}
        >
          <Ionicons name="pencil-outline" size={18} color="#5D4FB7" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.itemButton}
          onPress={() => removeItem(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#E57373" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
      <View style={styles.modalOverlay}>
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
            <Text style={styles.modalTitle}>
              {initialList ? 'Edit List' : 'Create New List'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#4A3C2C" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.inputLabel}>List Title</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter list title..."
            placeholderTextColor="#8B7355"
          />
          
          <Text style={styles.inputLabel}>Items</Text>
          
          {items.length > 0 ? (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              style={styles.itemsList}
            />
          ) : (
            <View style={styles.emptyItemsContainer}>
              <Text style={styles.emptyItemsText}>No items added yet</Text>
            </View>
          )}
          
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder={editingItemId ? "Edit item..." : "Add new item..."}
              placeholderTextColor="#8B7355"
              onSubmitEditing={editingItemId ? saveEditedItem : addItem}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={[styles.addItemButton, editingItemId && styles.editItemButton]}
              onPress={editingItemId ? saveEditedItem : addItem}
            >
              <Ionicons 
                name={editingItemId ? "checkmark" : "add"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.inputLabel}>Choose an Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
            {iconOptions.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.selectedIconOption
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons 
                  name={icon as any} 
                  size={24} 
                  color={selectedIcon === icon ? "#FFFFFF" : "#5D4FB7"} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {initialList ? 'Update List' : 'Save List'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  closeButton: {
    padding: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3C2C',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F4E3',
    borderWidth: 1,
    borderColor: '#E8DBC5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3C2C',
    marginBottom: 16,
  },
  itemsList: {
    maxHeight: 150,
    marginBottom: 10,
  },
  emptyItemsContainer: {
    height: 9,
    marginBottom: 20,
  },
  emptyItemsText: {
    color: '#8B7355',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4E3',
    borderWidth: 1,
    borderColor: '#E8DBC5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#4A3C2C',
  },
  itemActions: {
    flexDirection: 'row',
  },
  itemButton: {
    padding: 5,
    marginLeft: 5,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#F8F4E3',
    borderWidth: 1,
    borderColor: '#E8DBC5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3C2C',
    marginRight: 8,
  },
  addItemButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5D4FB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editItemButton: {
    backgroundColor: '#4CAF50',
  },
  iconScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  selectedIconOption: {
    backgroundColor: '#5D4FB7',
    borderColor: '#5D4FB7',
  },
  saveButton: {
    backgroundColor: '#5D4FB7',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ListModal;
