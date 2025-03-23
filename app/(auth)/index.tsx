import { Redirect } from 'expo-router';

export default function AuthIndex() {
  // Redirect to the sign-in page by default
  return <Redirect href="/signin" />;
}
