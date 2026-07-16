import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  getAvailability,
  setAvailableDates,
} from "@/javascript/AvailableDates";

const WEEK_DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

const formatTimeString = (date: Date) => date.toTimeString().slice(0, 5);

const parseTimeString = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};
const DAY_NAMES = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};
export default function Availability() {
  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ); // Default +7 days
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  useEffect(() => {
    calculateAvailableDays(startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const data = await getAvailability(); // your axios function
      setAvailability(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAvailability(false);
    }
  };

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

  const setDates = async () => {
    const data = {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      availabilityDetails: days
        .filter((day) => day.enabled)
        .map((day) => ({
          day_of_week: day.id,
          start_time: day.start_time,
          end_time: day.end_time,
          pause_start: day.pause_start,
          pause_end: day.pause_end,
        })),
    };

    try {
      const message = await setAvailableDates(data);
      Alert.alert("Success", message);
      await loadAvailability();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Availability</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Availability</Text>

        {loadingAvailability ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : (
          availability.map((item) => (
            <View key={item.id_availability} style={styles.cardGroupOuter}>
              <View style={styles.cardGroup}>
                <View style={styles.cellRow}>
                  <Text style={styles.cellLabel}>
                    {item.start_date} → {item.end_date}
                  </Text>
                </View>

                {item.availabilityDetails.map((d, index) => (
                  <View key={index}>
                    <View style={styles.separator} />
                    <View style={styles.cellRow}>
                      <View>
                        <Text style={styles.dayNameActive}>
                          {DAY_NAMES[d.day_of_week]}
                        </Text>

                        <Text style={styles.statusSubtitle}>
                          {d.start_time.slice(0, 5)}
                          {" - "}
                          {d.end_time.slice(0, 5)}
                        </Text>

                        {d.pause_start && (
                          <Text style={styles.statusSubtitle}>
                            Break {d.pause_start.slice(0, 5)}
                            {" - "}
                            {d.pause_end.slice(0, 5)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
      {/* DATE RANGE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.cardGroup}>
          <View style={styles.cellRow}>
            <Text style={styles.cellLabel}>Start Date</Text>
            <DateTimePicker
              value={startDate}
              mode="date"
              display="compact"
              style={styles.compactPicker}
              onChange={(e, date) => date && setStartDate(date)}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.cellRow}>
            <Text style={styles.cellLabel}>End Date</Text>
            <DateTimePicker
              value={endDate}
              mode="date"
              display="compact"
              minimumDate={startDate}
              style={styles.compactPicker}
              onChange={(e, date) => date && setEndDate(date)}
            />
          </View>
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
              <View key={day.id} style={styles.cardGroupOuter}>
                <View style={styles.cardGroup}>
                  <Pressable
                    style={styles.cellRow}
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
                        trackColor={{ false: "#E9E9EA", true: "#34C759" }}
                        thumbColor="#FFFFFF"
                        value={day.enabled}
                        onValueChange={(v) => updateDay(day.id, "enabled", v)}
                      />
                      <Text
                        style={[
                          styles.chevron,
                          isExpanded && styles.chevronExpanded,
                        ]}
                      >
                        ›
                      </Text>
                    </View>
                  </Pressable>

                  {isExpanded && day.enabled && (
                    <View style={styles.dayContent}>
                      <Text style={styles.groupLabel}>Working Hours</Text>
                      <View style={styles.timeRow}>
                        <View style={styles.timeCell}>
                          <Text style={styles.timeLabel}>Starts</Text>
                          <DateTimePicker
                            value={parseTimeString(day.start_time)}
                            mode="time"
                            display="compact"
                            is24Hour={true}
                            onChange={(e, date) =>
                              date &&
                              updateDay(
                                day.id,
                                "start_time",
                                formatTimeString(date),
                              )
                            }
                          />
                        </View>
                        <View style={styles.timeCell}>
                          <Text style={styles.timeLabel}>Ends</Text>
                          <DateTimePicker
                            value={parseTimeString(day.end_time)}
                            mode="time"
                            display="compact"
                            is24Hour={true}
                            onChange={(e, date) =>
                              date &&
                              updateDay(
                                day.id,
                                "end_time",
                                formatTimeString(date),
                              )
                            }
                          />
                        </View>
                      </View>

                      <Text style={[styles.groupLabel, { marginTop: 16 }]}>
                        Break Duration
                      </Text>
                      <View style={styles.timeRow}>
                        <View style={styles.timeCell}>
                          <Text style={styles.timeLabel}>From</Text>
                          <DateTimePicker
                            value={parseTimeString(day.pause_start)}
                            mode="time"
                            display="compact"
                            is24Hour={true}
                            onChange={(e, date) =>
                              date &&
                              updateDay(
                                day.id,
                                "pause_start",
                                formatTimeString(date),
                              )
                            }
                          />
                        </View>
                        <View style={styles.timeCell}>
                          <Text style={styles.timeLabel}>To</Text>
                          <DateTimePicker
                            value={parseTimeString(day.pause_end)}
                            mode="time"
                            display="compact"
                            is24Hour={true}
                            onChange={(e, date) =>
                              date &&
                              updateDay(
                                day.id,
                                "pause_end",
                                formatTimeString(date),
                              )
                            }
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
      </View>

      <Pressable style={styles.button} onPress={setDates}>
        <Text style={styles.buttonText}>Save Availability</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  contentContainer: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6C6C70",
    marginBottom: 8,
    marginHorizontal: 28,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardGroupOuter: {
    marginBottom: 10,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 48,
    backgroundColor: "#FFFFFF",
  },
  cellLabel: {
    fontSize: 17,
    color: "#000000",
  },
  compactPicker: {
    marginRight: -8, // Tucks the native pill nicely against the right side
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C6C6C8",
    marginLeft: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dayName: {
    fontSize: 17,
    fontWeight: "500",
    color: "#8E8E93",
  },
  dayNameActive: {
    color: "#000000",
    fontWeight: "600",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chevron: {
    fontSize: 20,
    color: "#C4C4C6",
    fontWeight: "300",
    transform: [{ rotate: "90deg" }],
  },
  chevronExpanded: {
    transform: [{ rotate: "-90deg" }],
  },
  dayContent: {
    padding: 16,
    backgroundColor: "#FAFAFC",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6C6C70",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
  },
  timeCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  timeLabel: {
    fontSize: 15,
    color: "#8E8E93",
  },
  button: {
    backgroundColor: "#007AFF",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
