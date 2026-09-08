import { getTerminet } from "@/javascript/employees/TerminetAPI";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DAYS_HEADER = ["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"];

// Types matching Backend Data
export interface Client {
  ID: number;
  emri: string;
  mbiemri: string;
  numri_telefonit: string;
  email: string;
  pershkrimi: string | null;
  data_regjistrimit: string;
}

export interface Service {
  ID: number;
  emri_sherbimit: string;
  kohezgjatja: number;
  qmimi_baze: number;
  zbritja: number;
  pershkrimi: string;
}

export interface AppointmentDetail {
  id_detajet_termineve: number;
  id_terminit: number;
  kohezgjatja: number;
  pagesa: number;
  sherbimet: Service;
}

export interface Appointment {
  id_terminit: number;
  employee_id: number;
  client: Client;
  data_caktimit: string;
  data_krijimit: string;
  pershkrimi: string;
  detajet_terminit: AppointmentDetail[];
}

export interface OccupiedDateInfo {
  count: number;
  times: string[];
  appointments: Appointment[];
}

// Helper to format Date object into YYYY-MM-DD
const formatDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to format ISO time to HH:MM string and calculate end time based on minutes duration
const formatTimeRange = (isoString: string, totalMinutes: number): string => {
  const startDate = new Date(isoString);
  const endDate = new Date(startDate.getTime() + totalMinutes * 60000);

  const startFormatted = startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endFormatted = endDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${startFormatted} - ${endFormatted}`;
};

export default function Home() {
  const router = useRouter();

  // State
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    new Date(2026, 0, 1),
  ); // Jan 2026 based on data
  const [selectedDate, setSelectedDate] = useState<string>("2026-01-19");
  const [occupiedDates, setOccupiedDates] = useState<
    Record<string, OccupiedDateInfo>
  >({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadTerminet();
  }, []);

  const loadTerminet = async () => {
    try {
      setLoading(true);
      const data: Appointment[] = await getTerminet();
      if (!data) return;

      const map: Record<string, OccupiedDateInfo> = {};

      data.forEach((apt) => {
        // Extract YYYY-MM-DD from "data_caktimit"
        const dateKey = apt.data_caktimit.split("T")[0];

        // Calculate total duration from service details
        const totalDuration = (apt.detajet_terminit || []).reduce(
          (sum, detail) => sum + (detail.kohezgjatja || 0),
          0,
        );

        const timeSlot = formatTimeRange(apt.data_caktimit, totalDuration);

        if (!map[dateKey]) {
          map[dateKey] = {
            count: 0,
            times: [],
            appointments: [],
          };
        }

        map[dateKey].count += 1;
        map[dateKey].times.push(timeSlot);
        map[dateKey].appointments.push(apt);
      });

      setOccupiedDates(map);

      // Automatically select the first appointment's date if available
      const dates = Object.keys(map);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setCurrentMonthDate(new Date(dates[0]));
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate day grid dynamically based on `currentMonthDate`
  const getDaysInMonthGrid = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const totalDays = new Date(year, month + 1, 0).getDate();

    // Day of week index (0 = Mon, 6 = Sun)
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; // Adjust Sunday

    const days: (string | null)[] = [];

    // Empty cells before the 1st day of the month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      days.push(formatDateString(d));
    }

    return days;
  };

  const monthYearLabel = currentMonthDate.toLocaleDateString("sq-AL", {
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Navigation Quick Actions */}
      <Pressable
        style={styles.actionCard}
        onPress={() => router.push("/skills")}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="color-palette-outline" size={22} color="#4F46E5" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Aftësitë</Text>
            <Text style={styles.subtitle}>Menaxhoni aftësitë</Text>
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

      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarTitleRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#4F46E5"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.calendarMonthTitle}>
              {monthYearLabel.charAt(0).toUpperCase() + monthYearLabel.slice(1)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.fullCalendarButton}
            onPress={() => router.push("/Terminet")}
          >
            <Text style={styles.fullCalendarText}>Shiko të gjitha</Text>
            <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.daysHeaderRow}>
          {DAYS_HEADER.map((day, idx) => (
            <Text key={idx} style={styles.dayHeaderCell}>
              {day}
            </Text>
          ))}
        </View>

        {/* Dynamic Calendar Grid */}
        <View style={styles.calendarGrid}>
          {getDaysInMonthGrid().map((dateStr, index) => {
            if (!dateStr) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dayNum = parseInt(dateStr.split("-")[2], 10);
            const isOccupied = !!occupiedDates[dateStr];
            const isSelected = selectedDate === dateStr;

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
            Terminet më{" "}
            {selectedDate ? selectedDate.split("-").reverse().join(".") : "-"}
          </Text>

          {occupiedDates[selectedDate] ? (
            <View style={styles.appointmentsList}>
              {occupiedDates[selectedDate].appointments.map((apt, i) => (
                <View
                  key={apt.id_terminit || i}
                  style={styles.appointmentBadge}
                >
                  <Ionicons name="person" size={14} color="#4F46E5" />
                  <Text style={styles.appointmentText}>
                    {apt.client
                      ? `${apt.client.emri} ${apt.client.mbiemri}`
                      : "Klient"}{" "}
                    - {occupiedDates[selectedDate].times[i]}
                  </Text>
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
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
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
    width: "14.28%",
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
    flexDirection: "column",
    gap: 8,
  },
  appointmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
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
