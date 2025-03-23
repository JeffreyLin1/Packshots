import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="signin" 
        options={{ 
          title: 'Sign In',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          title: 'Sign Up',
          headerShown: false
        }} 
      />
    </Stack>
  );
}
