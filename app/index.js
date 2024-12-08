import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function App() {
  const router = useRouter();// Navigation zwischen Seiten
  const theme = useTheme();// Zugriff auf Farbschema

  return (
    // Hauptcontainer für die App
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.title}>Willkommen zur To-Do App!</Text>
        <Text style={styles.subtitle}>Organisiere deine Aufgaben einfach und effizient.</Text>

   {/* Navigation-Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => router.push('/todo')}
            style={styles.button}
            icon="clipboard-text"
          >
            Zur To-Do Liste
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/settings')}
            style={styles.button}
            icon="cog"
          >
            Push-Einstellungen
          </Button>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    marginVertical: 10,
    width: '80%',
    borderRadius: 8,
  },
});
