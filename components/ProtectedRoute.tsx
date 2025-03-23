import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSegments } from 'expo-router';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to sign in if not authenticated and not in auth group
      router.replace('/(auth)/signin');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/');
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}
