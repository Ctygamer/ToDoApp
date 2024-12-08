import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Pressable, Alert } from "react-native";
import * as Notifications from "expo-notifications";

export default function Settings() {
  const [selectedOption, setSelectedOption] = useState(null);

  // Optionen für Benachrichtigungen
  const options = [
    { label: "Alle 5 Minuten", value: 5 },
    { label: "Alle 10 Minuten", value: 10 },
    { label: "Alle 15 Minuten", value: 15 },
    { label: "Benachrichtigungen deaktivieren", value: "disabled" },
  ];

  // Einmalige Initialisierung, um die Benachrichtigungsberechtigung abzufragen
  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Berechtigung benötigt",
          "Bitte aktiviere Benachrichtigungen in den Einstellungen."
        );
      }
    };
    getPermission(); // Berechtigungen anfordern
  }, []);           // Läuft nur einmal nach der Initialisierung

  // Funktion zum Planen von Push-Benachrichtigungen
  const setNotification = async (interval) => {
    await Notifications.cancelAllScheduledNotificationsAsync(); // Alte Benachrichtigungen entfernen
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Erinnerung",
        body: "Hast du deine Aufgaben erledigt?",
      },
      trigger: {
        seconds: parseInt(interval) * 60, // Sicherstellen, dass "interval" eine Zahl ist
        repeats: true,                    // Wiederholung aktivieren
      },
    });
  };

  // Handler-Funktion für die Buttons
  const handlePress = async (option) => {
    setSelectedOption(option.value); // Ausgewählte Option speichern

    if (option.value === "disabled") {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert("Benachrichtigungen deaktiviert");   // Benachrichtigungen deaktivieren
    } else {
      await setNotification(option.value);  // Benachrichtigungen planen
      Alert.alert(
        "Benachrichtigungen aktiviert",
        `Erinnerung alle ${option.value} Minuten eingestellt.`   // Feedback für den Nutzer
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Benachrichtigungseinstellungen</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.optionButton,
              selectedOption === option.value && styles.selectedOptionButton,
            ]}
            onPress={() => handlePress(option)}
          >
            <Text
              style={[
                styles.optionText,
                selectedOption === option.value && styles.selectedOptionText,
              ]}
            >
              {option.value === "disabled" && selectedOption === "disabled"  // Text des Buttons: Ändert sich, wenn "Benachrichtigungen deaktivieren" ausgewählt ist
                ? "Benachrichtigung deaktiviert"
                : option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  optionButton: {
    width: 250,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  selectedOptionButton: {
    backgroundColor: "#6a0dad",
    borderColor: "#6a0dad",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  selectedOptionText: {
    color: "#fff",
  },
});
