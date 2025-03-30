import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

export default function TabBar() {
  const currentPath = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const navigateTo = (path: string) => {
    router.replace(path);
  };

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tabItem, isActive('/') && styles.activeTab]}
        onPress={() => navigateTo('/')}
      >
        <Ionicons 
          name={isActive('/') ? "home" : "home-outline"} 
          size={24} 
          color={isActive('/') ? "#5D4FB7" : "#8B7355"} 
        />
        <Text style={[styles.tabLabel, isActive('/') && styles.activeTabLabel]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabItem, isActive('/saved-lists') && styles.activeTab]}
        onPress={() => navigateTo('/saved-lists')}
      >
        <Ionicons 
          name={isActive('/saved-lists') ? "bookmark" : "bookmark-outline"} 
          size={24} 
          color={isActive('/saved-lists') ? "#5D4FB7" : "#8B7355"} 
        />
        <Text style={[styles.tabLabel, isActive('/saved-lists') && styles.activeTabLabel]}>My Lists</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabItem, isActive('/profile') && styles.activeTab]}
        onPress={() => navigateTo('/profile')}
      >
        <Ionicons 
          name={isActive('/profile') ? "settings" : "settings-outline"} 
          size={24} 
          color={isActive('/profile') ? "#5D4FB7" : "#8B7355"} 
        />
        <Text style={[styles.tabLabel, isActive('/profile') && styles.activeTabLabel]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8DBC5',
    paddingVertical: 5,
    backgroundColor: '#F8F4E3',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#5D4FB7',
    marginTop: -1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    color: '#8B7355',
  },
  activeTabLabel: {
    color: '#5D4FB7',
    fontWeight: '600',
  },
});
