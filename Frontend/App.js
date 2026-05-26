import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';  // ← add this import
import DocumentScreen from './screens/DocumentScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <DocumentScreen />
      </View>
    </SafeAreaProvider>
  );
}