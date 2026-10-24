import { COLORS, RADIUS, SERIF } from "@/constants/theme";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// Parse "YYYY-MM-DD" as a LOCAL date (new Date("YYYY-MM-DD") is parsed as UTC
// and can show the previous day in some timezones)
const parseDateString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
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
  const insets = useSafeAreaInsets();

  // State
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateString(new Date()),
  );
  const [occupiedDates, setOccupiedDates] = useState<
    Record<string, OccupiedDateInfo>
  >({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const setup = async () => {
      await loadTerminet();
    };

    setup();
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

      // Automatically select the earliest appointment date if available
      const dates = Object.keys(map).sort();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setCurrentMonthDate(parseDateString(dates[0]));
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
      bounces={false}
    >
      {/* Header band */}
      <View style={[styles.headerZone, { paddingTop: insets.top + 32 }]}>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Portali i Stafit</Text>
        </View>
        <Text style={styles.headerTitle}>Terminet</Text>
        <Text style={styles.headerTitleSerif}>tuaja</Text>
        <Text style={styles.headerSubtitle}>
          Shihni orarin, menaxhoni aftësitë dhe disponueshmërinë.
        </Text>
      </View>

      <View style={styles.body}>
        {/* Navigation Quick Actions */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}
          onPress={() => router.push("/skills")}
        >
          <View style={styles.cardLeft}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={COLORS.goldLight}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Aftësitë</Text>
              <Text style={styles.subtitle}>Menaxhoni aftësitë</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.light} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}
          onPress={() => router.push("/AvailableDates")}
        >
          <View style={styles.cardLeft}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="time-outline"
                size={22}
                color={COLORS.goldLight}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Disponueshmëria</Text>
              <Text style={styles.subtitle}>
                Caktoni apo ndryshoni orarin e punës
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.light} />
        </Pressable>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View style={styles.calendarTitleRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.green}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.calendarMonthTitle}>
                {monthYearLabel.charAt(0).toUpperCase() +
                  monthYearLabel.slice(1)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fullCalendarButton}
              onPress={() => router.push("/Terminet")}
              activeOpacity={0.8}
            >
              <Text style={styles.fullCalendarText}>Shiko të gjitha</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.green} />
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
                  activeOpacity={0.8}
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
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.gold }]}
              />
              <Text style={styles.legendText}>Data me termine</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.creamDark }]}
              />
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
                    <Ionicons name="person" size={14} color={COLORS.green} />
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  contentContainer: {
    paddingBottom: 48,
  },

  /* Header band (.termini-header) */
  headerZone: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 22,
    paddingBottom: 74,
  },
  badgePill: {
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    color: COLORS.goldSoft,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#F7F5EF",
    fontSize: 42,
    fontWeight: "500",
    letterSpacing: -2.5,
    lineHeight: 42,
    textAlign: "center",
  },
  headerTitleSerif: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontWeight: "400",
    color: COLORS.goldSoft,
    fontSize: 42,
    letterSpacing: -1.7,
    lineHeight: 46,
    textAlign: "center",
  },
  headerSubtitle: {
    maxWidth: 320,
    marginTop: 22,
    color: "rgba(255, 255, 255, 0.66)",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
  },

  /* Body overlaps the header (.termini-container margin-top) */
  body: {
    marginHorizontal: 12,
    marginTop: -34,
  },

  /* Quick action cards */
  actionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: RADIUS.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  actionCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  /* Calendar card */
  calendarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: RADIUS.card,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  calendarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  calendarMonthTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.7,
  },
  fullCalendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  fullCalendarText: {
    marginRight: 5,
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  daysHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: "14.28%",
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: 22,
  },
  dayCellSelected: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 3,
  },
  dayNumber: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  occupiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.gold,
    marginTop: 3,
  },
  occupiedDotSelected: {
    backgroundColor: COLORS.goldLight,
  },

  /* Legend */
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 20,
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
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  /* Selected day details (.employee-profile-preview style) */
  dayDetailsBox: {
    marginTop: 18,
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsTitle: {
    marginBottom: 12,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  appointmentsList: {
    flexDirection: "column",
    gap: 10,
  },
  appointmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
  },
  appointmentText: {
    marginLeft: 8,
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  noAppointmentsText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "550" as any,
  },
});