import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Pressable, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    const initializeNotifications = async () => {
      // Berechtigung anfordern
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Berechtigung benötigt",
          "Bitte aktiviere Benachrichtigungen in den Einstellungen."
        );
      }

      // Gespeicherte Option laden
      const savedOption = await loadNotificationOption();
      if (savedOption) {
        setSelectedOption(savedOption);
        if (savedOption !== "disabled") {
          try {
            await setNotification(savedOption);
          } catch (error) {
            console.error("Fehler beim Setzen der Benachrichtigung:", error);
          }
        }
      }
    };
    initializeNotifications();
  }, []);

  // Funktion zum Speichern der Benachrichtigungseinstellung in AsyncStorage
  const saveNotificationOption = async (option) => {
    try {
      await AsyncStorage.setItem("notificationOption", JSON.stringify(option));
    } catch (error) {
      console.error("Fehler beim Speichern der Benachrichtigungseinstellung:", error);
    }
  };

  // Funktion zum Laden der Benachrichtigungseinstellung aus AsyncStorage
  const loadNotificationOption = async () => {
    try {
      const savedOption = await AsyncStorage.getItem("notificationOption");
      return savedOption ? JSON.parse(savedOption) : null;
    } catch (error) {
      console.error("Fehler beim Laden der Benachrichtigungseinstellung:", error);
      return null;
    }
  };

  // Funktion zum Planen von Push-Benachrichtigungen
  const setNotification = async (interval) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync(); // Alte Benachrichtigungen entfernen
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Erinnerung",
          body: "Hast du deine Aufgaben erledigt?",
        },
        trigger: {
          seconds: parseInt(interval) * 60, // Sicherstellen, dass "interval" eine Zahl ist
          repeats: true, // Wiederholung aktivieren
        },
      });
    } catch (error) {
      console.error("Fehler beim Planen der Benachrichtigung:", error);
    }
  };

  // Handler-Funktion für die Buttons
  const handlePress = async (option) => {
    setSelectedOption(option.value); // Ausgewählte Option speichern
    await saveNotificationOption(option.value); // Auswahl speichern

    if (option.value === "disabled") {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert("Benachrichtigungen deaktiviert"); // Benachrichtigungen deaktivieren
      } catch (error) {
        console.error("Fehler beim Deaktivieren der Benachrichtigungen:", error);
      }
    } else {
      try {
        await setNotification(option.value); // Benachrichtigungen planen
        Alert.alert(
          "Benachrichtigungen aktiviert",
          `Erinnerung alle ${option.value} Minuten eingestellt.` // Feedback für den Nutzer
        );
      } catch (error) {
        console.error("Fehler beim Aktivieren der Benachrichtigungen:", error);
      }
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
              {option.value === "disabled" && selectedOption === "disabled" // Text des Buttons: Ändert sich, wenn "Benachrichtigungen deaktivieren" ausgewählt ist
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
