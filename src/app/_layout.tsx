import { Stack } from 'expo-router'
import { ClerkProvider } from '@clerk/clerk-expo'
import { Provider as PaperProvider } from 'react-native-paper'


export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
     <PaperProvider>
             <Stack screenOptions={{ headerShown: false }} />
     </PaperProvider>
    </ClerkProvider>
  )
}
