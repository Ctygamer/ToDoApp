import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    // Gestenhandler-Root, um Gesten wie Wischen oder Drücken zu ermöglichen
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack />
    </GestureHandlerRootView>
  );
}
