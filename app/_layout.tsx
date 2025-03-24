import { Stack } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  
  // Simple delay to ensure layout is fully mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D2B48C" />
      </View>
    );
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
});
