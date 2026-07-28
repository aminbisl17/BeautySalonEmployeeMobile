import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Example occupied dates data (you can pass real data from your API here)
const OCCUPIED_DATES: Record<string, { count: number; times: string[] }> = {
  "2026-07-28": { count: 2, times: ["10:00 - 11:00", "14:30 - 15:30"] },
  "2026-07-29": { count: 1, times: ["12:00 - 13:00"] },
  "2026-07-31": {
    count: 3,
    times: ["09:00 - 10:00", "11:30 - 12:30", "16:00 - 17:00"],
  },
  "2026-08-03": { count: 2, times: ["13:00 - 14:00", "15:00 - 16:00"] },
};

const DAYS_HEADER = ["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"];

export default function Home() {
  const router = useRouter();

  // Current view month/year state
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-28");

  // Helper to generate days of current grid view (July 2026)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    return `2026-07-${formattedDay}`;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header 
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ballina</Text>
        </View>
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push("/Profile")}
        >
          <Ionicons name="person-outline" size={20} color="#4F46E5" />
        </Pressable>
      </View> */}

      {/* Quick Action: Availability Setup */}

      <Pressable
        style={styles.actionCard}
        onPress={() => router.push("/skills")}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="color-palette-outline" size={22} color="#4F46E5" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Aftesite</Text>
            <Text style={styles.subtitle}>Menaxhoni aftesite</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </Pressable>
      <Pressable
        style={styles.actionCard}
        onPress={() => router.push("/AvailableDates")}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={22} color="#4F46E5" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Disponueshmëria</Text>
            <Text style={styles.subtitle}>
              Caktoni apo ndryshoni orarin e punës
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </Pressable>

      {/* Interactive Calendar Section */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarTitleRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#4F46E5"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.calendarMonthTitle}>Korrik 2026</Text>
          </View>

          <TouchableOpacity
            style={styles.fullCalendarButton}
            onPress={() => router.push("/Terminet")}
          >
            <Text style={styles.fullCalendarText}>Shiko të gjitha</Text>
            <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Days of week header */}
        <View style={styles.daysHeaderRow}>
          {DAYS_HEADER.map((day, idx) => (
            <Text key={idx} style={styles.dayHeaderCell}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {/* Empty offset days for start of month alignment */}
          <View style={styles.dayCell} />
          <View style={styles.dayCell} />

          {daysInMonth.map((dateStr) => {
            const dayNum = parseInt(dateStr.split("-")[2], 10);
            const isOccupied = !!OCCUPIED_DATES[dateStr];
            const isSelected = selectedDate === dateStr;
            const count = OCCUPIED_DATES[dateStr]?.count || 0;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {dayNum}
                </Text>

                {/* Status Dot / Badge for Occupied Dates */}
                {isOccupied && (
                  <View
                    style={[
                      styles.occupiedDot,
                      isSelected && styles.occupiedDotSelected,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calendar Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.legendText}>Data me termine</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E2E8F0" }]} />
            <Text style={styles.legendText}>E lirë</Text>
          </View>
        </View>

        {/* Selected Day Details Box */}
        <View style={styles.dayDetailsBox}>
          <Text style={styles.detailsTitle}>
            Terminet më {selectedDate.split("-").reverse().join(".")}
          </Text>

          {OCCUPIED_DATES[selectedDate] ? (
            <View style={styles.appointmentsList}>
              {OCCUPIED_DATES[selectedDate].times.map((time, i) => (
                <View key={i} style={styles.appointmentBadge}>
                  <Ionicons name="time" size={14} color="#4F46E5" />
                  <Text style={styles.appointmentText}>{time}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noAppointmentsText}>
              Nuk ka termine të zëna për këtë datë.
            </Text>
          )}
        </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  profileButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
  },

  /* Action Card */
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Calendar Card Component */
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarMonthTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  fullCalendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fullCalendarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
    marginRight: 4,
  },

  /* Calendar Grid Styles */
  daysHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: 38,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%", // 7 columns per week
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: "#4F46E5",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  occupiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#EF4444",
    marginTop: 3,
  },
  occupiedDotSelected: {
    backgroundColor: "#FFFFFF",
  },

  /* Legend */
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#64748B",
  },

  /* Day Details Drawer */
  dayDetailsBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  appointmentsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  appointmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  appointmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    marginLeft: 6,
  },
  noAppointmentsText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
});
