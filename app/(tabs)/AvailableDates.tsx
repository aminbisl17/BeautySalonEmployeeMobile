import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  deleteDate,
  getAvailability,
  setAvailableDates,
  updateDates,
} from "@/javascript/AvailableDates";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// --- Types & Interfaces ---
interface AvailabilityDetail {
  day_of_week: number;
  start_time: string;
  end_time: string;
  pause_start?: string;
  pause_end?: string;
}

interface AvailabilityItem {
  id_availability: number;
  start_date: string;
  end_date: string;
  availabilityDetails: AvailabilityDetail[];
}

interface DaySetup {
  id: number;
  name: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  pause_start: string;
  pause_end: string;
}
// --- Constants & Static Helpers ---
const WEEK_DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

const formatTimeString = (date: Date) => date.toTimeString().slice(0, 5);

const normalizeToMidnight = (d: Date): Date => {
  const clean = new Date(d);
  clean.setHours(0, 0, 0, 0);
  return clean;
};

const parseTimeString = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateOnlyString = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const isDateOccupied = (
  date: Date,
  availabilityList: AvailabilityItem[],
  currentIdToIgnore?: number,
) => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return availabilityList.some((item) => {
    if (currentIdToIgnore && item.id_availability === currentIdToIgnore)
      return false;

    const start = parseDateOnlyString(item.start_date);
    const end = parseDateOnlyString(item.end_date);
    return checkDate >= start && checkDate <= end;
  });
};

// --- Main Component ---
export default function Availability() {
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const router = useRouter();
  const [expandedSavedCard, setExpandedSavedCard] = useState<number | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<number | null>(
    null,
  );
  const [editedData, setEditedData] = useState<Omit<
    AvailabilityItem,
    "id_availability"
  > | null>(null);

  const [startDate, setStartDate] = useState<Date>(() =>
    normalizeToMidnight(new Date()),
  );
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return normalizeToMidnight(d);
  });

  const [availableDays, setAvailableDays] = useState<number[]>([]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAvailability();
    setRefreshing(false);
  }, []);

  const [days, setDays] = useState<DaySetup[]>(
    WEEK_DAYS.map((day) => ({
      ...day,
      enabled: false,
      start_time: "08:00",
      end_time: "17:00",
      pause_start: "12:00",
      pause_end: "13:00",
    })),
  );

  useEffect(() => {
    calculateAvailableDays(startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    loadAvailability();
  }, []);

  // Custom Memo Hook for handling calendar highlights if used in component

  const loadAvailability = async () => {
    try {
      const data = await getAvailability();
      setAvailability(data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAvailability(false);
    }
  };

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

  const updateDay = (id: number, field: keyof DaySetup, value: any) => {
    setDays((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const setDates = async () => {
    const data = {
      start_date: formatDateString(startDate),
      end_date: formatDateString(endDate),
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
      setShowSetupForm(false);
      await loadAvailability();
    } catch (error) {
      console.log(error);
    }
  };

  const startEditing = (item: AvailabilityItem) => {
    setEditingAvailability(item.id_availability);

    setEditedData({
      start_date: item.start_date, // Kept in payload structure if required by API schema, but not editable
      end_date: item.end_date, // Kept in payload structure if required by API schema, but not editable
      availabilityDetails: item.availabilityDetails.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        pause_start: d.pause_start || "12:00:00", // Fallback default if empty
        pause_end: d.pause_end || "13:00:00", // Fallback default if empty
      })),
    });
  };

  const saveAvailability = async () => {
    if (!editedData || !editingAvailability) return;

    try {
      // 1. Send the updated payload
      const updatedRecord = await updateDates(editedData, editingAvailability);

      // 2. Option A: Update local state immediately using functional state update
      setAvailability((prevList) =>
        prevList.map((item) =>
          item.id_availability === editingAvailability
            ? { ...item, ...editedData } // or updatedRecord if backend returns updated object
            : item,
        ),
      );

      //console.log(editingAvailability);
      //console.log(editedData);
      //console.log(updatedRecord);
      // Close edit mode
      setEditingAvailability(null);
      setEditedData(null);

      // 3. Option B: Refetch fresh data from API
      // await loadAvailability();
    } catch (error) {
      console.error("Error saving availability updates:", error);
    }
  };

  const deleteAvailability = async (id: number) => {
    Alert.alert(
      "Delete Availability",
      "Are you sure you want to delete this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDate(id);
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

  const formatDateAlbanian = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    // Checks if the date is valid
    if (isNaN(date.getTime())) return dateString;

    // Formats as "15 Qershor 2026"
    return date.toLocaleDateString("sq-AL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  // Helper to strip time and normalize to local midnight

  // -------------------------------------------------------------
  // 1. START DATE ONCHANGE
  // -------------------------------------------------------------
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) return;

    const cleanStartDate = normalizeToMidnight(selectedDate);
    const targetEndDate = cleanStartDate > endDate ? cleanStartDate : endDate;

    // Check for conflicts
    let hasConflict = false;
    const current = new Date(cleanStartDate.getTime());

    while (current <= targetEndDate) {
      if (isDateOccupied(current, availability)) {
        hasConflict = true;
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    if (hasConflict) {
      Alert.alert(
        "Unavailable Range",
        "The selected range contains dates that are already occupied.",
      );
      return;
    }

    setStartDate(cleanStartDate);
    if (cleanStartDate > endDate) {
      setEndDate(cleanStartDate);
    }
  };

  // -------------------------------------------------------------
  // 2. END DATE ONCHANGE
  // -------------------------------------------------------------
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) return;

    const cleanEndDate = normalizeToMidnight(selectedDate);

    // Check for conflicts
    let hasConflict = false;
    const current = new Date(startDate.getTime());

    while (current <= cleanEndDate) {
      if (isDateOccupied(current, availability)) {
        hasConflict = true;
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    if (hasConflict) {
      Alert.alert(
        "Unavailable Range",
        "The selected range contains dates that are already occupied.",
      );
      return;
    }

    setEndDate(cleanEndDate);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#4F46E5"
          colors={["#4F46E5"]}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/Home")}
        >
          <Ionicons name="arrow-back" size={22} color="#4F46E5" />
        </Pressable>

        <Text style={styles.title}>Availability</Text>
      </View>

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
                <View
                  style={[
                    styles.currentCard,
                    isSavedCardExpanded && styles.cardActiveShadow,
                  ]}
                >
                  <Pressable
                    style={styles.currentHeaderRow}
                    onPress={() =>
                      setExpandedSavedCard(
                        isSavedCardExpanded ? null : item.id_availability,
                      )
                    }
                  >
                    <View style={styles.headerTitleContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#4F46E5"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.currentDateRange}>
                        {formatDateAlbanian(item.start_date)} →{" "}
                        {formatDateAlbanian(item.end_date)}
                      </Text>
                    </View>

                    <Ionicons
                      name={isSavedCardExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#94A3B8"
                    />
                  </Pressable>

                  {isSavedCardExpanded &&
                    (isEditing ? (
                      <View style={styles.editContainer}>
                        {/* Date fields removed per requirements. Loop over availabilityDetails for days/breaks */}

                        {editedData?.availabilityDetails.map((d, index) => {
                          // Convert current selected string values into Date objects for picker boundaries
                          const workStart = parseTimeString(d.start_time);
                          const workEnd = parseTimeString(d.end_time);
                          const pauseStart = parseTimeString(
                            d.pause_start || "12:00:00",
                          );
                          const pauseEnd = parseTimeString(
                            d.pause_end || "13:00:00",
                          );

                          return (
                            <View key={index} style={styles.editDayCard}>
                              <View style={styles.dayTitleRow}>
                                <View style={styles.detailBadge} />
                                <Text style={styles.dayNameActive}>
                                  {DAY_NAMES[d.day_of_week]}
                                </Text>
                              </View>

                              {/* Work Times */}
                              <View style={styles.timeRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.inputLabel}>
                                    Start Time
                                  </Text>
                                  <DateTimePicker
                                    value={workStart}
                                    mode="time"
                                    display="compact"
                                    is24Hour={true}
                                    // Start time cannot exceed End time
                                    maximumDate={workEnd}
                                    onChange={(e, date) => {
                                      if (!date || !editedData) return;
                                      const details = [
                                        ...editedData.availabilityDetails,
                                      ];
                                      details[index] = {
                                        ...details[index],
                                        start_time: formatTimeString(date),
                                      };
                                      setEditedData({
                                        ...editedData,
                                        availabilityDetails: details,
                                      });
                                    }}
                                  />
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.inputLabel}>
                                    End Time
                                  </Text>
                                  <DateTimePicker
                                    value={workEnd}
                                    mode="time"
                                    display="compact"
                                    is24Hour={true}
                                    // End time cannot be earlier than Start time
                                    minimumDate={workStart}
                                    onChange={(e, date) => {
                                      if (!date || !editedData) return;
                                      const details = [
                                        ...editedData.availabilityDetails,
                                      ];
                                      details[index] = {
                                        ...details[index],
                                        end_time: formatTimeString(date),
                                      };
                                      setEditedData({
                                        ...editedData,
                                        availabilityDetails: details,
                                      });
                                    }}
                                  />
                                </View>
                              </View>

                              {/* Pause / Break Times */}
                              <View style={[styles.timeRow, { marginTop: 10 }]}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.inputLabel}>
                                    Pause Start
                                  </Text>
                                  <DateTimePicker
                                    value={pauseStart}
                                    mode="time"
                                    display="compact"
                                    is24Hour={true}
                                    // Must be after work start, but before pause end
                                    minimumDate={workStart}
                                    maximumDate={pauseEnd}
                                    onChange={(e, date) => {
                                      if (!date || !editedData) return;
                                      const details = [
                                        ...editedData.availabilityDetails,
                                      ];
                                      details[index] = {
                                        ...details[index],
                                        pause_start: formatTimeString(date),
                                      };
                                      setEditedData({
                                        ...editedData,
                                        availabilityDetails: details,
                                      });
                                    }}
                                  />
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.inputLabel}>
                                    Pause End
                                  </Text>
                                  <DateTimePicker
                                    value={pauseEnd}
                                    mode="time"
                                    display="compact"
                                    is24Hour={true}
                                    // Must be after pause start, but before work end
                                    minimumDate={pauseStart}
                                    maximumDate={workEnd}
                                    onChange={(e, date) => {
                                      if (!date || !editedData) return;
                                      const details = [
                                        ...editedData.availabilityDetails,
                                      ];
                                      details[index] = {
                                        ...details[index],
                                        pause_end: formatTimeString(date),
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
                          );
                        })}

                        <View style={styles.buttonRow}>
                          <Pressable
                            style={styles.cancelButton}
                            onPress={() => {
                              setEditingAvailability(null);
                              setEditedData(null);
                            }}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </Pressable>

                          <Pressable
                            style={styles.saveButton}
                            onPress={saveAvailability}
                          >
                            <Text style={styles.saveButtonText}>
                              Save Updates
                            </Text>
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

                              <Text style={styles.detailTimeText}>
                                {d.start_time.slice(0, 5)} -{" "}
                                {d.end_time.slice(0, 5)}
                              </Text>

                              {d.pause_start && d.pause_end && (
                                <Text style={styles.breakText}>
                                  Break: {d.pause_start.slice(0, 5)} -{" "}
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
                              size={16}
                              color="#4F46E5"
                              style={{ marginRight: 4 }}
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
                              size={16}
                              color="#EF4444"
                              style={{ marginRight: 4 }}
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
          <Ionicons
            name={showSetupForm ? "chevron-up" : "chevron-down"}
            size={22}
            color="#4F46E5"
          />
        </Pressable>

        {showSetupForm && (
          <View style={styles.formContainer}>
            {/* DATE RANGE */}
            <Text style={styles.innerSectionTitle}>Select Date Range</Text>
            <View style={styles.cardGroup}>
              {/* START DATE */}
              <View style={styles.cellRow}>
                <Text style={styles.cellLabel}>Start Date</Text>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="compact"
                  minimumDate={normalizeToMidnight(new Date())} // Cannot pick past dates
                  onChange={handleStartDateChange}
                />
              </View>

              <View style={styles.separator} />

              {/* END DATE */}
              <View style={styles.cellRow}>
                <Text style={styles.cellLabel}>End Date</Text>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="compact"
                  minimumDate={startDate} // End date cannot be earlier than start date
                  onChange={handleEndDateChange}
                />
              </View>
            </View>

            {/* WORKING DAYS */}
            <Text style={[styles.innerSectionTitle, { marginTop: 24 }]}>
              Working Days Setup
            </Text>
            {days
              .filter((day) => availableDays.includes(day.id))
              .map((day) => {
                const isExpanded = expanded === day.id;

                // Convert string times into Date objects for picker boundaries
                const workStart = parseTimeString(day.start_time);
                const workEnd = parseTimeString(day.end_time);
                const pauseStart = parseTimeString(
                  day.pause_start || "12:00:00",
                );
                const pauseEnd = parseTimeString(day.pause_end || "13:00:00");

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
                            trackColor={{ false: "#E2E8F0", true: "#818CF8" }}
                            thumbColor={day.enabled ? "#4F46E5" : "#94A3B8"}
                            value={day.enabled}
                            onValueChange={(v) =>
                              updateDay(day.id, "enabled", v)
                            }
                          />
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#94A3B8"
                          />
                        </View>
                      </Pressable>

                      {isExpanded && day.enabled && (
                        <View style={styles.dayContent}>
                          <Text style={styles.groupLabel}>Working Hours</Text>
                          <View style={styles.timeRow}>
                            <View style={styles.timeCell}>
                              <Text style={styles.timeLabel}>Starts</Text>
                              <DateTimePicker
                                value={workStart}
                                mode="time"
                                display="compact"
                                is24Hour={true}
                                // Start time cannot exceed End time
                                maximumDate={workEnd}
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
                                value={workEnd}
                                mode="time"
                                display="compact"
                                is24Hour={true}
                                // End time cannot be earlier than Start time
                                minimumDate={workStart}
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
                                value={pauseStart}
                                mode="time"
                                display="compact"
                                is24Hour={true}
                                // Must be after work start, but before pause end
                                minimumDate={workStart}
                                maximumDate={pauseEnd}
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
                                value={pauseEnd}
                                mode="time"
                                display="compact"
                                is24Hour={true}
                                // Must be after pause start, but before work end
                                minimumDate={pauseStart}
                                maximumDate={workEnd}
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
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    marginHorizontal: 20,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  innerSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
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
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  setupToggleFormButtonActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  setupToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  setupToggleSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardGroupOuter: {
    marginBottom: 12,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardActiveBorder: {
    borderColor: "#C7D2FE",
  },
  currentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActiveShadow: {
    shadowOpacity: 0.06,
    shadowRadius: 12,
    borderColor: "#C7D2FE",
  },
  currentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentDateRange: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
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
    backgroundColor: "#4F46E5",
    marginTop: 6,
    marginRight: 10,
  },
  detailTimeText: {
    fontSize: 14,
    color: "#334155",
    marginTop: 2,
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  cellLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
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
    fontSize: 15,
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  breakText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayContent: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  timeCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeLabel: {
    fontSize: 14,
    color: "#475569",
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loading: {
    textAlign: "center",
    color: "#64748B",
    marginVertical: 20,
  },
  editContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#0F172A",
  },
  editDayCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginBottom: 0,
  },
});
