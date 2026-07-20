import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getAvailability,
  setAvailableDates,
} from "@/javascript/AvailableDates";
import { Ionicons } from "@expo/vector-icons";

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
  const [expandedSavedCard, setExpandedSavedCard] = useState<number | null>(
    null,
  );

  // New state to toggle the main setup form visibility
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [editedData, setEditedData] = useState(null);

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
      const data = await getAvailability();
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
      setShowSetupForm(false); // Collapse form upon success
      await loadAvailability();
    } catch (error) {
      console.log(error);
    }
  };

  const startEditing = (item) => {
    setEditingAvailability(item.id_availability);

    setEditedData({
      start_date: item.start_date,
      end_date: item.end_date,
      availabilityDetails: item.availabilityDetails.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        pause_start: d.pause_start,
        pause_end: d.pause_end,
      })),
    });
  };

  const saveAvailability = async () => {
    const payload = {
      start_date: editedData.start_date,
      end_date: editedData.end_date,
      availabilityDetails: editedData.availabilityDetails,
    };

    console.log(payload);

    await fetch(`YOUR_API/updateAvailability/${editingAvailability}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setEditingAvailability(null);
    setEditedData(null);

    // reload data
  };

  const deleteAvailability = async (id) => {
    Alert.alert(
      "Delete Availability",
      "Are you sure you want to delete this schedule?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`YOUR_API_URL/availability/${id}`, {
                method: "DELETE",
              });

              setAvailability((prev) =>
                prev.filter((item) => item.id_availability !== id),
              );
            } catch (error) {
              console.log(error);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Availability</Text>

      {/* CURRENT AVAILABILITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Availability</Text>

        {loadingAvailability ? (
          <Text style={styles.loading}>Loading configurations...</Text>
        ) : (
          availability.map((item) => {
            const isSavedCardExpanded =
              expandedSavedCard === item.id_availability;

            const isEditing = editingAvailability === item.id_availability;

            return (
              <View key={item.id_availability} style={styles.cardGroupOuter}>
                <View style={styles.currentCard}>
                  <Pressable
                    style={styles.currentHeaderRow}
                    onPress={() =>
                      setExpandedSavedCard(
                        isSavedCardExpanded ? null : item.id_availability,
                      )
                    }
                  >
                    <Text style={styles.currentDateRange}>
                      {item.start_date} → {item.end_date}
                    </Text>

                    <Text
                      style={[
                        styles.chevron,
                        isSavedCardExpanded && styles.chevronExpanded,
                      ]}
                    >
                      ›
                    </Text>
                  </Pressable>

                  {isSavedCardExpanded &&
                    (isEditing ? (
                      <View style={styles.editContainer}>
                        <View style={styles.dateRow}>
                          <View style={styles.dateBox}>
                            <Text style={styles.inputLabel}>Start date</Text>

                            <TextInput
                              style={styles.input}
                              value={editedData?.start_date}
                              onChangeText={(value) =>
                                setEditedData((prev) => ({
                                  ...prev,
                                  start_date: value,
                                }))
                              }
                            />
                          </View>

                          <View style={styles.dateBox}>
                            <Text style={styles.inputLabel}>End date</Text>

                            <TextInput
                              style={styles.input}
                              value={editedData?.end_date}
                              onChangeText={(value) =>
                                setEditedData((prev) => ({
                                  ...prev,
                                  end_date: value,
                                }))
                              }
                            />
                          </View>
                        </View>

                        {editedData?.availabilityDetails.map((d, index) => (
                          <View key={index} style={styles.editDayCard}>
                            <View style={styles.dayTitleRow}>
                              <View style={styles.detailBadge} />

                              <Text style={styles.dayNameActive}>
                                {DAY_NAMES[d.day_of_week]}
                              </Text>
                            </View>

                            <View style={styles.timeRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Start</Text>

                                <TextInput
                                  style={styles.timeInput}
                                  value={d.start_time.substring(0, 5)}
                                  onChangeText={(value) => {
                                    const details = [
                                      ...editedData.availabilityDetails,
                                    ];

                                    details[index] = {
                                      ...details[index],
                                      start_time: value + ":00",
                                    };

                                    setEditedData({
                                      ...editedData,
                                      availabilityDetails: details,
                                    });
                                  }}
                                />
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>End</Text>

                                <TextInput
                                  style={styles.timeInput}
                                  value={d.end_time.substring(0, 5)}
                                  onChangeText={(value) => {
                                    const details = [
                                      ...editedData.availabilityDetails,
                                    ];

                                    details[index] = {
                                      ...details[index],
                                      end_time: value + ":00",
                                    };

                                    setEditedData({
                                      ...editedData,
                                      availabilityDetails: details,
                                    });
                                  }}
                                />
                              </View>
                            </View>
                          </View>
                        ))}

                        <View style={styles.buttonRow}>
                          <Pressable
                            style={styles.cancelButton}
                            onPress={() => {
                              setEditingAvailability(null);
                              setEditedData(null);
                            }}
                          >
                            <Text>Cancel</Text>
                          </Pressable>

                          <Pressable
                            style={styles.saveButton}
                            onPress={saveAvailability}
                          >
                            <Text>Save</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <>
                        {item.availabilityDetails.map((d, index) => (
                          <View key={index} style={styles.currentDetailItem}>
                            <View style={styles.detailBadge} />

                            <View style={{ flex: 1 }}>
                              <Text style={styles.dayNameActive}>
                                {DAY_NAMES[d.day_of_week]}
                              </Text>

                              <Text>
                                {d.start_time.slice(0, 5)}
                                {" - "}
                                {d.end_time.slice(0, 5)}
                              </Text>

                              {d.pause_start && (
                                <Text>
                                  Break: {d.pause_start.slice(0, 5)}-
                                  {d.pause_end.slice(0, 5)}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}

                        <View style={styles.actionButtons}>
                          <Pressable
                            style={styles.editButton}
                            onPress={() => startEditing(item)}
                          >
                            <Ionicons
                              name="create-outline"
                              size={18}
                              color="#333"
                            />

                            <Text style={styles.editButtonText}>Edit</Text>
                          </Pressable>

                          <Pressable
                            style={styles.deleteButton}
                            onPress={() =>
                              deleteAvailability(item.id_availability)
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="#D32F2F"
                            />

                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </Pressable>
                        </View>
                      </>
                    ))}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* EXPANDABLE TRIGGER FOR CONFIGURATION FORM */}
      <View style={styles.section}>
        <Pressable
          style={[
            styles.setupToggleFormButton,
            showSetupForm && styles.setupToggleFormButtonActive,
          ]}
          onPress={() => setShowSetupForm(!showSetupForm)}
        >
          <View>
            <Text style={styles.setupToggleTitle}>Set New Availability</Text>
            <Text style={styles.setupToggleSubtitle}>
              Define your dates, active days, and times
            </Text>
          </View>
          <Text
            style={[
              styles.mainChevron,
              showSetupForm && styles.chevronExpanded,
            ]}
          >
            ›
          </Text>
        </Pressable>

        {showSetupForm && (
          <View style={styles.formContainer}>
            {/* DATE RANGE */}
            <Text style={styles.innerSectionTitle}>Select Date Range</Text>
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

            {/* WORKING DAYS */}
            <Text style={[styles.innerSectionTitle, { marginTop: 20 }]}>
              Working Days Setup
            </Text>
            {days
              .filter((day) => availableDays.includes(day.id))
              .map((day) => {
                const isExpanded = expanded === day.id;
                return (
                  <View key={day.id} style={styles.cardGroupOuter}>
                    <View
                      style={[
                        styles.cardGroup,
                        day.enabled && styles.cardActiveBorder,
                      ]}
                    >
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
                              : "Closed / Unavailable"}
                          </Text>
                        </View>

                        <View style={styles.headerRight}>
                          <Switch
                            trackColor={{ false: "#E5E5EA", true: "#6366F1" }}
                            thumbColor="#FFFFFF"
                            value={day.enabled}
                            onValueChange={(v) =>
                              updateDay(day.id, "enabled", v)
                            }
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

                          <Text style={[styles.groupLabel, { marginTop: 18 }]}>
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

            <Pressable style={styles.button} onPress={setDates}>
              <Text style={styles.buttonText}>Save Availability</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingBottom: 48,
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
    marginHorizontal: 24,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  innerSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setupToggleFormButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  setupToggleFormButtonActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#FAFAFC",
    borderBottomWidth: 0,
  },
  setupToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  setupToggleSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#E2E8F0",
    paddingTop: 12,
  },
  cardGroupOuter: {
    marginBottom: 12,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardActiveBorder: {
    borderColor: "#CBD5E1",
  },
  currentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  currentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  currentDateRange: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  currentDetailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6366F1",
    marginTop: 8,
    marginRight: 10,
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  cellLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
  },
  compactPicker: {
    marginRight: -4,
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#94A3B8",
  },
  dayNameActive: {
    color: "#0F172A",
    fontWeight: "600",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  breakText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  tapToViewText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    fontStyle: "italic",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chevron: {
    fontSize: 22,
    color: "#94A3B8",
    fontWeight: "300",
    transform: [{ rotate: "90deg" }],
  },
  mainChevron: {
    fontSize: 26,
    color: "#4F46E5",
    fontWeight: "300",
    transform: [{ rotate: "90deg" }],
  },
  chevronExpanded: {
    transform: [{ rotate: "-90deg" }],
  },
  dayContent: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  button: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loading: {
    fontSize: 14,
    color: "#64748B",
    marginHorizontal: 24,
    fontStyle: "italic",
  },

  editContainer: {
    paddingTop: 15,
  },

  dateRow: {
    flexDirection: "row",
    gap: 12,
  },

  dateBox: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 5,
  },

  editDayCard: {
    marginTop: 15,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f6f6f6",
  },

  dayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },

  timeInput: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "white",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 15,
  },

  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  editButton: {
    marginTop: 15,
    alignSelf: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 15,
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFECEC",
  },

  deleteButtonText: {
    color: "#D32F2F",
    fontWeight: "600",
    fontSize: 14,
  },
});
