import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const WEEK_DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

export default function Availability() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (startDate && endDate) {
      calculateAvailableDays(startDate, endDate);
    }
  }, [startDate, endDate]);

  const [days, setDays] = useState(
    WEEK_DAYS.map((day) => ({
      ...day,
      enabled: false,
      start_time: "09:00",
      end_time: "17:00",
      pause_start: "12:00",
      pause_end: "13:00",
    })),
  );

  const calculateAvailableDays = (start: Date, end: Date) => {
    if (!start || !end) return;
    const found = new Set<number>();
    let current = new Date(start);

    while (current <= end) {
      let day = current.getDay();
      day = day === 0 ? 7 : day;
      found.add(day);
      current.setDate(current.getDate() + 1);
    }
    setAvailableDays([...found]);
  };

  const updateDay = (id: number, field: string, value: any) => {
    setDays((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Availability</Text>

      {/* DATE RANGE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.dateCard}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.label}>Start Date</Text>
            <Text style={styles.value}>
              {startDate ? startDate.toISOString().split("T")[0] : "Pick date"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.dateCard}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.label}>End Date</Text>
            <Text style={styles.value}>
              {endDate ? endDate.toISOString().split("T")[0] : "Pick date"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* WORKING DAYS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Days</Text>
        {days
          .filter((day) => availableDays.includes(day.id))
          .map((day) => {
            const isExpanded = expanded === day.id;
            return (
              <View
                key={day.id}
                style={[styles.dayCard, day.enabled && styles.dayCardActive]}
              >
                <Pressable
                  style={styles.dayHeader}
                  onPress={() => setExpanded(isExpanded ? null : day.id)}
                >
                  <View style={styles.headerLeft}>
                    <Text
                      style={[
                        styles.dayName,
                        day.enabled && styles.dayNameActive,
                      ]}
                    >
                      {day.name}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      {day.enabled
                        ? `${day.start_time} - ${day.end_time}`
                        : "Closed"}
                    </Text>
                  </View>

                  <View style={styles.headerRight}>
                    <Switch
                      trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                      thumbColor={day.enabled ? "#2563EB" : "#F1F5F9"}
                      value={day.enabled}
                      onValueChange={(v) => updateDay(day.id, "enabled", v)}
                    />
                    <Text style={styles.arrow}>{isExpanded ? "▲" : "▼"}</Text>
                  </View>
                </Pressable>

                {isExpanded && day.enabled && (
                  <View style={styles.dayContent}>
                    <Text style={styles.groupLabel}>Working Hours</Text>
                    <View style={styles.row}>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>From</Text>
                        <TextInput
                          style={styles.input}
                          value={day.start_time}
                          onChangeText={(v) =>
                            updateDay(day.id, "start_time", v)
                          }
                        />
                      </View>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>To</Text>
                        <TextInput
                          style={styles.input}
                          value={day.end_time}
                          onChangeText={(v) => updateDay(day.id, "end_time", v)}
                        />
                      </View>
                    </View>

                    <Text style={[styles.groupLabel, { marginTop: 12 }]}>
                      Break Duration
                    </Text>
                    <View style={styles.row}>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Start</Text>
                        <TextInput
                          style={styles.input}
                          value={day.pause_start}
                          onChangeText={(v) =>
                            updateDay(day.id, "pause_start", v)
                          }
                        />
                      </View>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>End</Text>
                        <TextInput
                          style={styles.input}
                          value={day.pause_end}
                          onChangeText={(v) =>
                            updateDay(day.id, "pause_end", v)
                          }
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
      </View>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Save Availability</Text>
      </Pressable>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          minimumDate={startDate || undefined}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  label: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  dayCardActive: {
    borderColor: "#BFDBFE",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  dayNameActive: {
    color: "#0F172A",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  arrow: {
    fontSize: 12,
    color: "#94A3B8",
    width: 16,
    textAlign: "center",
  },
  dayContent: {
    padding: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    paddingLeft: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
