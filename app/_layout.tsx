import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </ProtectedRoute>
    </AuthProvider>
  );
}
