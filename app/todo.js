import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Alert, Animated } from 'react-native';
import { Button, IconButton, Card, Paragraph, FAB, useTheme } from 'react-native-paper';
import { Audio } from 'expo-av';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hauptkomponente der App
export default function ToDoApp() {
  const theme = useTheme(); // Verwendet das aktuelle Theme der App
  const [tasks, setTasks] = useState([]); // Zustand für die Liste der Aufgaben
  const [task, setTask] = useState(''); // Zustand für die Texteingabe
  const [recording, setRecording] = useState(null); // Zustand der aktuellen Audioaufnahme
  const [sound, setSound] = useState(null); // Zustand für die Audio-Wiedergabe
  const [isPlayingId, setIsPlayingId] = useState(null); // ID der gerade abgespielten Aufgabe
  const progressRef = useRef(new Animated.Value(0)).current; // Referenz für die Fortschrittsanimation

  // Lädt gespeicherte Aufgaben aus dem lokalen Speicher beim Start
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('tasks'); // Abrufen gespeicherter Aufgaben
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks)); // Aufgaben in den Zustand laden
        }
      } catch (error) {
        console.error('Fehler beim Laden der Aufgaben:', error);
      }
    };
    loadTasks();
  }, []);

  // Speichert Aufgaben im lokalen Speicher
  const saveTasks = async (updatedTasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks)); // Aufgaben als JSON speichern
    } catch (error) {
      console.error('Fehler beim Speichern der Aufgaben:', error);
    }
  };

  // Konfiguriert den Audio-Modus (z. B. für Hintergrundwiedergabe)
  const configureAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, // Audioaufnahme auf iOS deaktivieren
        playsInSilentModeIOS: true, // Audio auch im Stumm-Modus abspielen
        staysActiveInBackground: true, // Audio im Hintergrund aktiv lassen
        shouldDuckAndroid: true, // Andere Apps leiser stellen
        playThroughEarpieceAndroid: false, // Hauptlautsprecher verwenden
      });
    } catch (err) {
      console.error('Fehler beim Einstellen des Audio-Modus:', err);
    }
  };

  // Fügt eine neue Textaufgabe hinzu
  const addTask = () => {
    if (!task.trim()) {
      Alert.alert('Fehler', 'Bitte eine Aufgabe eingeben.'); // Validierung für leere Eingaben
      return;
    }
    const newTask = { id: Date.now().toString(), text: task, type: 'text', completed: false }; // Neue Aufgabe erstellen
    const updatedTasks = [...tasks, newTask]; // Aufgabe zur Liste hinzufügen
    setTasks(updatedTasks); // Zustand aktualisieren
    saveTasks(updatedTasks); // Aufgaben speichern
    setTask(''); // Eingabefeld zurücksetzen
  };

  // Startet die Audioaufnahme
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { status } = await Audio.requestPermissionsAsync(); // Berechtigungen anfordern
      if (status !== 'granted') {
        Alert.alert('Keine Berechtigung', 'Bitte erlaube den Zugriff auf das Mikrofon.');
        return;
      }

      const recording = new Audio.Recording(); // Neue Aufnahme starten
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording); // Aufnahme im Zustand speichern
    } catch (err) {
      console.error('Fehler beim Starten der Aufnahme:', err);
      Alert.alert('Fehler beim Starten der Aufnahme.');
    }
  };

  // Beendet die Audioaufnahme und speichert sie als Aufgabe
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync(); // Aufnahme stoppen
      const uri = recording.getURI(); // URI der Aufnahme abrufen

      const newTask = { id: Date.now().toString(), uri, type: 'audio', completed: false }; // Aufgabe mit Audio erstellen
      const updatedTasks = [...tasks, newTask]; // Aufgabe zur Liste hinzufügen
      setTasks(updatedTasks); // Zustand aktualisieren
      saveTasks(updatedTasks); // Aufgaben speichern

      setRecording(null); // Aufnahme zurücksetzen
    } catch (err) {
      console.error('Fehler beim Beenden der Aufnahme:', err);
      Alert.alert('Fehler beim Beenden der Aufnahme.');
    }
  };

  // Spielt eine gespeicherte Audio-Aufgabe ab
  const playAudio = async (task) => {
    try {
      if (sound) {
        await sound.unloadAsync(); // Vorherige Wiedergabe stoppen
        setSound(null);
        setIsPlayingId(null); // ID der Wiedergabe zurücksetzen
        progressRef.setValue(0); // Animation zurücksetzen
      }

      await configureAudioMode();

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: task.uri },
        { shouldPlay: true }
      );

      setSound(newSound); // Sound-Objekt speichern
      setIsPlayingId(task.id); // Aktive Aufgabe speichern

      // Animation für die Fortschrittsanzeige starten
      Animated.timing(progressRef, {
        toValue: 1,
        duration: status.durationMillis,
        useNativeDriver: false,
      }).start(() => {
        setIsPlayingId(null);
        progressRef.setValue(0);
      });

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlayingId(null);
          progressRef.setValue(0);
        }
      });

      await newSound.playAsync(); // Wiedergabe starten
    } catch (err) {
      console.error('Fehler beim Abspielen der Audio:', err);
      Alert.alert('Fehler beim Abspielen der Aufnahme.');
    }
  };

  // Stoppt die Audio-Wiedergabe
  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync(); // Wiedergabe stoppen
      setSound(null);
      setIsPlayingId(null); // ID der Wiedergabe zurücksetzen
      progressRef.setValue(0); // Animation zurücksetzen
    }
  };

  // Markiert eine Aufgabe als erledigt oder nicht erledigt
  const toggleComplete = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks); // Zustand aktualisieren
    saveTasks(updatedTasks); // Aufgaben speichern
  };

  // Löscht eine Aufgabe aus der Liste
  const deleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks); // Zustand aktualisieren
    saveTasks(updatedTasks); // Aufgaben speichern
  };

  // Zeigt die "Löschen"-Aktion beim Wischen an
  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteContainer}>
        <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>Löschen</Animated.Text>
      </View>
    );
  };

  // Darstellung einer Aufgabe (Text oder Audio)
  const renderTask = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
      onSwipeableOpen={() => deleteTask(item.id)}
    >
      <Card style={[styles.card, item.completed && { backgroundColor: '#d4edda' }]}>
        <Card.Content>
          {item.type === 'text' ? (
            <Paragraph style={item.completed && { textDecorationLine: 'line-through' }}>
              {item.text}
            </Paragraph>
          ) : (
            <View>
              <Paragraph>🎙️ Sprachnachricht</Paragraph>
              {isPlayingId === item.id && (
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressRef.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
              <Button
                mode="outlined"
                onPress={() => (isPlayingId === item.id ? stopAudio() : playAudio(item))}
                style={styles.playButton}
              >
                {isPlayingId === item.id ? 'Stoppen' : 'Abspielen'}
              </Button>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <IconButton
            icon={item.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
            size={20}
            onPress={() => toggleComplete(item.id)}
          />
        </Card.Actions>
      </Card>
    </Swipeable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.title}>Deine To-Do App</Text>
      {/* Eingabefeld für neue Aufgaben */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Neue Aufgabe..."
          value={task}
          onChangeText={setTask}
          style={styles.input}
        />
        <Button mode="contained" onPress={addTask} style={styles.addButton} icon="plus">
          Hinzufügen
        </Button>
      </View>
      {/* Audioaufnahme-Buttons */}
      <View style={styles.audioControls}>
        {recording ? (
          <FAB icon="stop" style={styles.fab} onPress={stopRecording} label="Stoppen" />
        ) : (
          <FAB icon="microphone" style={styles.fab} onPress={startRecording} label="Aufnehmen" />
        )}
      </View>
      {/* Aufgabenliste */}
      {tasks.length > 0 ? (
        <FlatList data={tasks} keyExtractor={(item) => item.id} renderItem={renderTask} />
      ) : (
        <Text style={styles.emptyListText}>Keine Aufgaben vorhanden. Füge eine Aufgabe hinzu.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  addButton: { marginLeft: 10, borderRadius: 10 },
  audioControls: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fab: {
    backgroundColor: '#6200ee',
    width: 150,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  card: { marginBottom: 15, borderRadius: 10, elevation: 2 },
  deleteContainer: { width: 80, backgroundColor: 'red', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 10 },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBar: { height: 5, backgroundColor: '#6200ee', borderRadius: 5 },
  emptyListText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
});
