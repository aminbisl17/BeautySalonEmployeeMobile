import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteDate,
  getAvailability,
  setAvailableDates,
  updateDates,
} from "@/javascript/employees/AvailableDates";
import { getSkills } from "@/javascript/employees/skillsAPI";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// --- Types & Interfaces ---

export interface ServiceAttribute {
  id_atributit: number;
  kohezgjatja: number;
  opsioni: string;
  pershkrimi: string;
  qmimi: number;
  zbritja: number;
}

export interface ServiceDetail {
  ID: number;
  avaSkillId: number;
  emri_sherbimit: string;
  kohezgjatja: number;
  qmimi_baze: number;
  zbritja: number;
  pershkrimi: string;
  imagePath?: string;
  imagepath?: string;
  created_at: string;
  updated_at: string;
  atributet: ServiceAttribute[];
}

export interface EmployeeService {
  id: number;
  id_employee: number;
  id_service: number;
  service: ServiceDetail;
}

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
  availableSkills?: number[];
  sherbimetDisplay: ServiceDetail[];
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
  { id: 1, name: "E Hënë" },
  { id: 2, name: "E Martë" },
  { id: 3, name: "E Mërkurë" },
  { id: 4, name: "E Enjte" },
  { id: 5, name: "E Premte" },
  { id: 6, name: "E Shtunë" },
  { id: 7, name: "E Diel" },
];

const DAY_NAMES: Record<number, string> = {
  1: "E Hënë",
  2: "E Martë",
  3: "E Mërkurë",
  4: "E Enjte",
  5: "E Premte",
  6: "E Shtunë",
  7: "E Diel",
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

  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);

  // Toggle skill selection on click
  const toggleSkillSelection = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("days"); // 'days' or 'skills'
  const [skills, setSkills] = useState<EmployeeService[]>([]);
  const [showSkillsForm, setSkillsForm] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
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

  const loadAvailability = async () => {
    try {
      const data = await getAvailability();
      setAvailability(data || []);

      const sk = await getSkills();
      setSkills(sk || []);
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
      availableSkills: selectedSkillIds,
    };

    console.log("Submitting Payload:", JSON.stringify(data, null, 2));

    try {
      const message = await setAvailableDates(data);
      Alert.alert("Sukses", message);
      setShowSetupForm(false);
      await loadAvailability();
    } catch (error) {
      console.log(error);
    }
  };

  const startEditing = (item: AvailabilityItem) => {
    setEditingAvailability(item.id_availability);
    setEditedData({
      start_date: item.start_date,
      end_date: item.end_date,

      availabilityDetails: item.availabilityDetails.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        pause_start: d.pause_start || "12:00:00",
        pause_end: d.pause_end || "13:00:00",
      })),

      availableSkills: item.availableSkills || [],
      sherbimetDisplay: item.sherbimetDisplay || [],
    });
  };

  const saveAvailability = async () => {
    if (!editedData || !editingAvailability) return;

    try {
      const payload = {
        availabilityDetails: editedData.availabilityDetails.map((d) => ({
          day_of_week: d.day_of_week,
          start_time: d.start_time,
          end_time: d.end_time,
          pause_start: d.pause_start,
          pause_end: d.pause_end,
        })),

        availableSkills: editedData.availableSkills ?? [],
      };

      await updateDates(payload, editingAvailability);

      setAvailability((prevList) =>
        prevList.map((item) =>
          item.id_availability === editingAvailability
            ? {
                ...item,
                ...editedData,
              }
            : item,
        ),
      );

      setEditingAvailability(null);
      setEditedData(null);
    } catch (error) {
      console.error(
        "Gabim gjatë ruajtjes së përditësimeve të disponueshmërisë:",
        error,
      );
    }
  };

  const deleteAvailability = async (id: number) => {
    Alert.alert(
      "Fshi Disponueshmërinë",
      "A jeni i sigurt që dëshironi ta fshini këtë orar?",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshi",
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

  const formatDateAlbanian = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("sq-AL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // 1. S// 1. START DATE ONCHANGE
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    // Handle Android back button/dismissal
    if (event?.type === "dismissed" || !selectedDate) return;

    const cleanStartDate = normalizeToMidnight(selectedDate);
    const targetEndDate = cleanStartDate > endDate ? cleanStartDate : endDate;

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
        "Lodhje e padisponueshme",
        "Lodhja e përzgjedhur përmban data që janë tashmë të zëna.",
      );
      return;
    }

    setStartDate(cleanStartDate);
    if (cleanStartDate > endDate) {
      setEndDate(cleanStartDate);
    }
  };

  const toggleSkill = (skillId: number) => {
    setEditedData((prev) => {
      if (!prev) return prev;

      const currentSkills = prev.availableSkills ?? [];
      const isSelected = currentSkills.includes(skillId);

      const selectedSkill = skills.find(
        (skill: EmployeeService) => skill.id === skillId,
      );

      if (!selectedSkill) {
        return prev;
      }

      if (isSelected) {
        // Deselect
        return {
          ...prev,
          availableSkills: currentSkills.filter((id) => id !== skillId),
          sherbimetDisplay: (prev.sherbimetDisplay ?? []).filter(
            (service) => service.avaSkillId !== skillId,
          ),
        };
      }

      // Select
      // Select branch inside toggleSkill
      const serviceDetail: ServiceDetail = {
        ...selectedSkill.service,
        avaSkillId: skillId,
        // Ensure both property variants are populated
        imagePath:
          selectedSkill.service.imagePath ?? selectedSkill.service.imagepath,
        imagepath:
          selectedSkill.service.imagepath ?? selectedSkill.service.imagePath,
      };

      return {
        ...prev,
        availableSkills: [...currentSkills, skillId],
        sherbimetDisplay: [...(prev.sherbimetDisplay ?? []), serviceDetail],
      };
    });
  };
  // 2. END DATE ONCHANGE
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed" || !selectedDate) return;

    const cleanEndDate = normalizeToMidnight(selectedDate);

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
        "Lodhje e padisponueshme",
        "Lodhja e përzgjedhur përmban data që janë tashmë të zëna.",
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

        <Text style={styles.title}>Disponueshmëria</Text>
      </View>

      {/* CURRENT AVAILABILITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disponueshmëria Aktuale</Text>

        {loadingAvailability ? (
          <Text style={styles.loading}>Po ngarkohen konfigurimet...</Text>
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
                        {/* ========================= */}
                        {/* TAB SWITCHER HEADER       */}
                        {/* ========================= */}
                        <View style={styles.tabContainer}>
                          <TouchableOpacity
                            style={[
                              styles.tabButton,
                              activeTab === "days" && styles.activeTabButton,
                            ]}
                            onPress={() => setActiveTab("days")}
                          >
                            <Text
                              style={[
                                styles.tabButtonText,
                                activeTab === "days" && styles.activeTabText,
                              ]}
                            >
                              Days of Week
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.tabButton,
                              activeTab === "skills" && styles.activeTabButton,
                            ]}
                            onPress={() => setActiveTab("skills")}
                          >
                            <Text
                              style={[
                                styles.tabButtonText,
                                activeTab === "skills" && styles.activeTabText,
                              ]}
                            >
                              Skills
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* ========================= */}
                        {/* AVAILABILITY DETAILS (DAYS)*/}
                        {/* ========================= */}
                        {activeTab === "days" && (
                          <View style={styles.tabContent}>
                            {editedData?.availabilityDetails.map((d, index) => {
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
                                        Ora e Fillimit
                                      </Text>
                                      <DateTimePicker
                                        value={workStart}
                                        mode="time"
                                        display="compact"
                                        is24Hour={true}
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
                                        Ora e Përfundimit
                                      </Text>
                                      <DateTimePicker
                                        value={workEnd}
                                        mode="time"
                                        display="compact"
                                        is24Hour={true}
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
                                  <View
                                    style={[styles.timeRow, { marginTop: 10 }]}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.inputLabel}>
                                        Fillimi i Pushimit
                                      </Text>
                                      <DateTimePicker
                                        value={pauseStart}
                                        mode="time"
                                        display="compact"
                                        is24Hour={true}
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
                                        Përfundimi i Pushimit
                                      </Text>
                                      <DateTimePicker
                                        value={pauseEnd}
                                        mode="time"
                                        display="compact"
                                        is24Hour={true}
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
                          </View>
                        )}

                        {/* ========================= */}
                        {/* AVAILABLE SKILLS          */}
                        {/* ========================= */}
                        {activeTab === "skills" && (
                          <View style={styles.skillsSection}>
                            <View style={styles.skillsHeader}>
                              <Text style={styles.sectionTitle}>
                                Available Skills
                              </Text>

                              <TouchableOpacity
                                style={styles.addSkillButton}
                                onPress={() => setShowSkillPicker(true)}
                              >
                                <Text style={styles.addSkillButtonText}>
                                  + Add Skill
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {editedData?.sherbimetDisplay?.length === 0 ? (
                              <Text style={styles.noSkillsText}>
                                No skills selected
                              </Text>
                            ) : (
                              editedData?.sherbimetDisplay?.map((skill) => (
                                <View
                                  key={skill.avaSkillId}
                                  style={styles.skillRow}
                                >
                                  {skill.imagePath ? (
                                    <Image
                                      source={{
                                        uri: `data:image/avif;base64,${skill.imagePath}`,
                                      }}
                                      style={styles.serviceImage}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <View style={styles.skillImagePlaceholder}>
                                      <Text style={styles.placeholderText}>
                                        No Image
                                      </Text>
                                    </View>
                                  )}

                                  <View style={styles.skillInfo}>
                                    <Text style={styles.skillName}>
                                      {skill.emri_sherbimit}
                                    </Text>

                                    <Text style={styles.skillPrice}>
                                      €{skill.qmimi_baze ?? 0}
                                    </Text>
                                  </View>

                                  <TouchableOpacity
                                    onPress={() => {
                                      if (!editedData) return;

                                      setEditedData({
                                        ...editedData,
                                        availableSkills:
                                          editedData.availableSkills.filter(
                                            (id) => id !== skill.avaSkillId,
                                          ),
                                        sherbimetDisplay:
                                          editedData.sherbimetDisplay.filter(
                                            (service) =>
                                              service.avaSkillId !==
                                              skill.avaSkillId,
                                          ),
                                      });
                                    }}
                                    style={styles.removeSkillButton}
                                  >
                                    <Text style={styles.removeSkillText}>
                                      Remove
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ))
                            )}
                          </View>
                        )}

                        {/* ========================= */}
                        {/* SAVE / CANCEL BUTTONS     */}
                        {/* ========================= */}
                        <View style={styles.buttonRow}>
                          <Pressable
                            style={styles.cancelButton}
                            onPress={() => {
                              setEditingAvailability(null);
                              setEditedData(null);
                            }}
                          >
                            <Text style={styles.cancelButtonText}>Anulo</Text>
                          </Pressable>

                          <Pressable
                            style={styles.saveButton}
                            onPress={saveAvailability}
                          >
                            <Text style={styles.saveButtonText}>
                              Ruaj Përditësimet
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.cardGroupOuter}>
                        <View
                          style={[
                            styles.currentCard,
                            editingAvailability === item.id_availability &&
                              styles.cardActiveShadow,
                          ]}
                        >
                          {/* Header displaying Date Range */}
                          <View style={styles.currentHeaderRow}>
                            <View style={styles.headerTitleContainer}>
                              <Ionicons
                                name="calendar-outline"
                                size={18}
                                color="#4F46E5"
                                style={{ marginRight: 8 }}
                              />
                              <Text style={styles.currentDateRange}>
                                {item.data_e_fillimit} -{" "}
                                {item.data_e_marveshjes}
                              </Text>
                            </View>
                          </View>

                          {/* ========================================= */}
                          {/* MODE 1: EDITING MODE                     */}
                          {/* ========================================= */}
                          {editingAvailability === item.id_availability ? (
                            <View style={styles.editContainer}>
                              {/* EDIT MODE TAB SWITCHER */}
                              <View style={styles.tabContainer}>
                                <TouchableOpacity
                                  style={[
                                    styles.tabButton,
                                    activeTab === "days" &&
                                      styles.activeTabButton,
                                  ]}
                                  onPress={() => setActiveTab("days")}
                                >
                                  <Ionicons
                                    name="calendar-outline"
                                    size={15}
                                    color={
                                      activeTab === "days"
                                        ? "#4F46E5"
                                        : "#64748B"
                                    }
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.tabButtonText,
                                      activeTab === "days" &&
                                        styles.activeTabText,
                                    ]}
                                  >
                                    Days of Week
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[
                                    styles.tabButton,
                                    activeTab === "skills" &&
                                      styles.activeTabButton,
                                  ]}
                                  onPress={() => setActiveTab("skills")}
                                >
                                  <Ionicons
                                    name="sparkles-outline"
                                    size={15}
                                    color={
                                      activeTab === "skills"
                                        ? "#4F46E5"
                                        : "#64748B"
                                    }
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.tabButtonText,
                                      activeTab === "skills" &&
                                        styles.activeTabText,
                                    ]}
                                  >
                                    Skills
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              {/* TAB 1: DAYS (EDIT) */}
                              {activeTab === "days" && (
                                <View style={styles.tabContent}>
                                  {editedData?.availabilityDetails.map(
                                    (d, index) => {
                                      const workStart = parseTimeString(
                                        d.start_time,
                                      );
                                      const workEnd = parseTimeString(
                                        d.end_time,
                                      );
                                      const pauseStart = parseTimeString(
                                        d.pause_start || "12:00:00",
                                      );
                                      const pauseEnd = parseTimeString(
                                        d.pause_end || "13:00:00",
                                      );

                                      return (
                                        <View
                                          key={index}
                                          style={styles.editDayCard}
                                        >
                                          <View style={styles.dayTitleRow}>
                                            <View style={styles.detailBadge} />
                                            <Text style={styles.dayNameActive}>
                                              {DAY_NAMES[d.day_of_week]}
                                            </Text>
                                          </View>

                                          <View style={styles.timeRow}>
                                            <View style={{ flex: 1 }}>
                                              <Text style={styles.inputLabel}>
                                                Ora e Fillimit
                                              </Text>
                                              <DateTimePicker
                                                value={workStart}
                                                mode="time"
                                                display="compact"
                                                is24Hour={true}
                                                maximumDate={workEnd}
                                                onChange={(e, date) => {
                                                  if (!date || !editedData)
                                                    return;
                                                  const details = [
                                                    ...editedData.availabilityDetails,
                                                  ];
                                                  details[index] = {
                                                    ...details[index],
                                                    start_time:
                                                      formatTimeString(date),
                                                  };
                                                  setEditedData({
                                                    ...editedData,
                                                    availabilityDetails:
                                                      details,
                                                  });
                                                }}
                                              />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                              <Text style={styles.inputLabel}>
                                                Ora e Përfundimit
                                              </Text>
                                              <DateTimePicker
                                                value={workEnd}
                                                mode="time"
                                                display="compact"
                                                is24Hour={true}
                                                minimumDate={workStart}
                                                onChange={(e, date) => {
                                                  if (!date || !editedData)
                                                    return;
                                                  const details = [
                                                    ...editedData.availabilityDetails,
                                                  ];
                                                  details[index] = {
                                                    ...details[index],
                                                    end_time:
                                                      formatTimeString(date),
                                                  };
                                                  setEditedData({
                                                    ...editedData,
                                                    availabilityDetails:
                                                      details,
                                                  });
                                                }}
                                              />
                                            </View>
                                          </View>

                                          <View
                                            style={[
                                              styles.timeRow,
                                              { marginTop: 10 },
                                            ]}
                                          >
                                            <View style={{ flex: 1 }}>
                                              <Text style={styles.inputLabel}>
                                                Fillimi i Pushimit
                                              </Text>
                                              <DateTimePicker
                                                value={pauseStart}
                                                mode="time"
                                                display="compact"
                                                is24Hour={true}
                                                minimumDate={workStart}
                                                maximumDate={pauseEnd}
                                                onChange={(e, date) => {
                                                  if (!date || !editedData)
                                                    return;
                                                  const details = [
                                                    ...editedData.availabilityDetails,
                                                  ];
                                                  details[index] = {
                                                    ...details[index],
                                                    pause_start:
                                                      formatTimeString(date),
                                                  };
                                                  setEditedData({
                                                    ...editedData,
                                                    availabilityDetails:
                                                      details,
                                                  });
                                                }}
                                              />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                              <Text style={styles.inputLabel}>
                                                Përfundimi i Pushimit
                                              </Text>
                                              <DateTimePicker
                                                value={pauseEnd}
                                                mode="time"
                                                display="compact"
                                                is24Hour={true}
                                                minimumDate={pauseStart}
                                                maximumDate={workEnd}
                                                onChange={(e, date) => {
                                                  if (!date || !editedData)
                                                    return;
                                                  const details = [
                                                    ...editedData.availabilityDetails,
                                                  ];
                                                  details[index] = {
                                                    ...details[index],
                                                    pause_end:
                                                      formatTimeString(date),
                                                  };
                                                  setEditedData({
                                                    ...editedData,
                                                    availabilityDetails:
                                                      details,
                                                  });
                                                }}
                                              />
                                            </View>
                                          </View>
                                        </View>
                                      );
                                    },
                                  )}
                                </View>
                              )}

                              {/* TAB 2: SKILLS (EDIT) */}
                              {activeTab === "skills" && (
                                <View style={styles.skillsSection}>
                                  <View style={styles.skillsHeader}>
                                    <Text style={styles.sectionTitle}>
                                      Available Skills
                                    </Text>
                                    <TouchableOpacity
                                      style={styles.addSkillButton}
                                      onPress={() => setShowSkillPicker(true)}
                                    >
                                      <Text style={styles.addSkillButtonText}>
                                        + Add Skill
                                      </Text>
                                    </TouchableOpacity>
                                  </View>

                                  {editedData?.sherbimetDisplay?.length ===
                                  0 ? (
                                    <Text style={styles.noSkillsText}>
                                      No skills selected
                                    </Text>
                                  ) : (
                                    editedData?.sherbimetDisplay?.map(
                                      (skill) => (
                                        <View
                                          key={skill.avaSkillId}
                                          style={styles.skillRow}
                                        >
                                          {skill.imagePath ? (
                                            <Image
                                              source={{
                                                uri: `data:image/avif;base64,${skill.imagePath}`,
                                              }}
                                              style={styles.serviceImage}
                                              resizeMode="cover"
                                            />
                                          ) : (
                                            <View
                                              style={
                                                styles.skillImagePlaceholder
                                              }
                                            >
                                              <Text
                                                style={styles.placeholderText}
                                              >
                                                No Image
                                              </Text>
                                            </View>
                                          )}

                                          <View style={styles.skillInfo}>
                                            <Text style={styles.skillName}>
                                              {skill.emri_sherbimit}
                                            </Text>
                                            <Text style={styles.skillPrice}>
                                              €{skill.qmimi_baze ?? 0}
                                            </Text>
                                          </View>

                                          <TouchableOpacity
                                            onPress={() => {
                                              if (!editedData) return;
                                              setEditedData({
                                                ...editedData,
                                                availableSkills:
                                                  editedData.availableSkills.filter(
                                                    (id) =>
                                                      id !== skill.avaSkillId,
                                                  ),
                                                sherbimetDisplay:
                                                  editedData.sherbimetDisplay.filter(
                                                    (service) =>
                                                      service.avaSkillId !==
                                                      skill.avaSkillId,
                                                  ),
                                              });
                                            }}
                                            style={styles.removeSkillButton}
                                          >
                                            <Text
                                              style={styles.removeSkillText}
                                            >
                                              Remove
                                            </Text>
                                          </TouchableOpacity>
                                        </View>
                                      ),
                                    )
                                  )}
                                </View>
                              )}

                              {/* EDIT ACTION BUTTONS */}
                              <View style={styles.buttonRow}>
                                <Pressable
                                  style={styles.cancelButton}
                                  onPress={() => {
                                    setEditingAvailability(null);
                                    setEditedData(null);
                                  }}
                                >
                                  <Text style={styles.cancelButtonText}>
                                    Anulo
                                  </Text>
                                </Pressable>

                                <Pressable
                                  style={styles.saveButton}
                                  onPress={saveAvailability}
                                >
                                  <Text style={styles.saveButtonText}>
                                    Ruaj Përditësimet
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          ) : (
                            /* ========================================= */
                            /* MODE 2: DISPLAY / READ-ONLY MODE         */
                            /* ========================================= */
                            <View style={{ marginTop: 12 }}>
                              {/* READ-ONLY TAB SWITCHER */}
                              <View style={styles.tabContainer}>
                                <TouchableOpacity
                                  style={[
                                    styles.tabButton,
                                    activeTab === "days" &&
                                      styles.activeTabButton,
                                  ]}
                                  onPress={() => setActiveTab("days")}
                                >
                                  <Ionicons
                                    name="calendar-outline"
                                    size={15}
                                    color={
                                      activeTab === "days"
                                        ? "#4F46E5"
                                        : "#64748B"
                                    }
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.tabButtonText,
                                      activeTab === "days" &&
                                        styles.activeTabText,
                                    ]}
                                  >
                                    Days of Week
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[
                                    styles.tabButton,
                                    activeTab === "skills" &&
                                      styles.activeTabButton,
                                  ]}
                                  onPress={() => setActiveTab("skills")}
                                >
                                  <Ionicons
                                    name="sparkles-outline"
                                    size={15}
                                    color={
                                      activeTab === "skills"
                                        ? "#4F46E5"
                                        : "#64748B"
                                    }
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.tabButtonText,
                                      activeTab === "skills" &&
                                        styles.activeTabText,
                                    ]}
                                  >
                                    Skills ({item.sherbimetDisplay?.length || 0}
                                    )
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              {/* TAB 1: DISPLAY DAYS */}
                              {activeTab === "days" && (
                                <View style={styles.tabContent}>
                                  {item.availabilityDetails.map((d, index) => (
                                    <View
                                      key={index}
                                      style={styles.currentDetailItem}
                                    >
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
                                            Pushimi: {d.pause_start.slice(0, 5)}{" "}
                                            - {d.pause_end.slice(0, 5)}
                                          </Text>
                                        )}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* TAB 2: DISPLAY SKILLS */}
                              {activeTab === "skills" && (
                                <View style={styles.tabContent}>
                                  {item?.sherbimetDisplay &&
                                  item.sherbimetDisplay.length > 0 ? (
                                    <View style={styles.servicesList}>
                                      {item.sherbimetDisplay.map((sherbi) => {
                                        const rawImageData = sherbi.imagePath;

                                        const imageUri = rawImageData
                                          ? rawImageData.startsWith(
                                              "data:image",
                                            )
                                            ? rawImageData
                                            : `data:image/avif;base64,${rawImageData.trim()}`
                                          : null;

                                        return (
                                          <View
                                            key={sherbi.ID}
                                            style={styles.serviceCard}
                                          >
                                            {imageUri ? (
                                              <Image
                                                source={{ uri: imageUri }}
                                                style={styles.serviceImage}
                                                resizeMode="cover"
                                              />
                                            ) : (
                                              <View
                                                style={
                                                  styles.serviceImagePlaceholder
                                                }
                                              >
                                                <Ionicons
                                                  name="construct-outline"
                                                  size={20}
                                                  color="#4F46E5"
                                                />
                                              </View>
                                            )}

                                            <View style={styles.serviceInfo}>
                                              <Text
                                                style={styles.serviceName}
                                                numberOfLines={1}
                                              >
                                                {sherbi.emri_sherbimit}
                                              </Text>

                                              <View style={styles.metaRow}>
                                                <View style={styles.metaBadge}>
                                                  <Ionicons
                                                    name="time-outline"
                                                    size={12}
                                                    color="#64748B"
                                                  />
                                                  <Text style={styles.metaText}>
                                                    {sherbi.kohezgjatja} min
                                                  </Text>
                                                </View>

                                                <View
                                                  style={[
                                                    styles.metaBadge,
                                                    styles.priceBadge,
                                                  ]}
                                                >
                                                  <Ionicons
                                                    name="pricetag-outline"
                                                    size={12}
                                                    color="#059669"
                                                  />
                                                  <Text
                                                    style={styles.priceText}
                                                  >
                                                    {sherbi.qmimi_baze} €
                                                  </Text>
                                                </View>
                                              </View>
                                            </View>
                                          </View>
                                        );
                                      })}
                                    </View>
                                  ) : (
                                    <Text style={styles.noSkillsText}>
                                      Nuk ka shërbime të caktuara.
                                    </Text>
                                  )}
                                </View>
                              )}

                              {/* CARD READ-ONLY ACTION BUTTONS */}
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
                                  <Text style={styles.editButtonText}>
                                    Ndrysho
                                  </Text>
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
                                  <Text style={styles.deleteButtonText}>
                                    Fshi
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
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
            styles.skillsSelectButton,
            showSetupForm && styles.setupToggleFormButtonActive,
          ]}
          onPress={() => setShowSetupForm(!showSetupForm)}
        >
          <View>
            <Text style={styles.setupToggleTitle}>
              Vendos Disponueshmëri të Re
            </Text>
            <Text style={styles.setupToggleSubtitle}>
              Përcaktoni datat, ditët aktive dhe oraret
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
            <Text style={styles.innerSectionTitle}>
              Zgjidh Periudhën e Datave
            </Text>

            <View style={styles.cardGroup}>
              {/* START DATE */}
              <View style={styles.cellRow}>
                <Text style={styles.cellLabel}>Data e Fillimit</Text>
                <DateTimePicker
                  value={
                    startDate instanceof Date && !isNaN(startDate.getTime())
                      ? startDate
                      : new Date()
                  }
                  mode="date"
                  display="compact"
                  onChange={handleStartDateChange}
                />
              </View>

              <View style={styles.separator} />

              {/* END DATE */}
              <View style={styles.cellRow}>
                <Text style={styles.cellLabel}>Data e Përfundimit</Text>
                <DateTimePicker
                  value={
                    endDate instanceof Date && !isNaN(endDate.getTime())
                      ? endDate
                      : new Date()
                  }
                  mode="date"
                  display="compact"
                  minimumDate={
                    startDate instanceof Date && !isNaN(startDate.getTime())
                      ? startDate
                      : new Date()
                  }
                  onChange={handleEndDateChange}
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.setupToggleFormButton,
                styles.skillsSelectButton,
                showSkillsForm && styles.setupToggleFormButtonActive,
              ]}
              onPress={() => setSkillsForm(!showSkillsForm)}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.setupToggleTitle}>Zgjedh Shërbimet</Text>
                <Text style={styles.setupToggleSubtitle}>
                  Zgjidhni shërbimet apo aftësitë e aplikueshme
                </Text>
              </View>
              <Ionicons
                name={showSkillsForm ? "chevron-up" : "chevron-down"}
                size={22}
                color="#4F46E5"
              />
            </Pressable>
            {showSkillsForm && (
              <View style={styles.skillsListContainer}>
                {skills.map((item: EmployeeService) => {
                  const { service } = item;
                  const isSelected = selectedSkillIds.includes(item.id); // Check if skill ID is selected

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.serviceCard,
                        isSelected && styles.serviceCardSelected, // Highlight selected card
                      ]}
                      onPress={() => toggleSkillSelection(item.id)}
                    >
                      <View style={styles.serviceMainRow}>
                        {/* CHECKBOX INDICATOR */}
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={22}
                          color={isSelected ? "#4F46E5" : "#94A3B8"}
                          style={{ alignSelf: "center", marginRight: 4 }}
                        />

                        {/* SERVICE IMAGE */}
                        {service.imagePath ? (
                          <Image
                            source={{
                              uri: service.imagePath.startsWith("data:image")
                                ? service.imagePath
                                : `data:image/jpeg;base64,${service.imagePath}`,
                            }}
                            style={styles.serviceImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.serviceImage,
                              styles.imagePlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="image-outline"
                              size={24}
                              color="#94A3B8"
                            />
                          </View>
                        )}

                        {/* SERVICE DETAILS */}
                        <View style={styles.serviceContent}>
                          <Text style={styles.serviceTitle}>
                            {service.emri_sherbimit}
                          </Text>
                          <Text style={styles.metaText}>
                            {service.kohezgjatja} min
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {/* WORKING DAYS */}
            <Text style={[styles.innerSectionTitle, { marginTop: 24 }]}>
              Konfigurimi i Ditëve të Punës
            </Text>
            {days
              .filter((day) => availableDays.includes(day.id))
              .map((day) => {
                const isExpanded = expanded === day.id;

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
                              : "Mbyllur / E Padisponueshme"}
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
                          <Text style={styles.groupLabel}>Oraret e Punës</Text>
                          <View style={styles.timeRow}>
                            <View style={styles.timeCell}>
                              <Text style={styles.timeLabel}>Fillon</Text>
                              <DateTimePicker
                                value={workStart}
                                mode="time"
                                display="compact"
                                is24Hour={true}
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
                              <Text style={styles.timeLabel}>Përfundon</Text>
                              <DateTimePicker
                                value={workEnd}
                                mode="time"
                                display="compact"
                                is24Hour={true}
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
                            Kohëzgjatja e Pushimit
                          </Text>
                          <View style={styles.timeRow}>
                            <View style={styles.timeCell}>
                              <Text style={styles.timeLabel}>Nga</Text>
                              <DateTimePicker
                                value={pauseStart}
                                mode="time"
                                display="compact"
                                is24Hour={true}
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
                              <Text style={styles.timeLabel}>Deri</Text>
                              <DateTimePicker
                                value={pauseEnd}
                                mode="time"
                                display="compact"
                                is24Hour={true}
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

            <Pressable style={styles.submitButton} onPress={setDates}>
              <Text style={styles.submitButtonText}>Ruaj Disponueshmërinë</Text>
            </Pressable>
          </View>
        )}

        <Modal
          visible={showSkillPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSkillPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.skillModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Available Skills</Text>
                <Text style={styles.modalSubtitle}>
                  Select skills to assign
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {skills.map((skill: EmployeeService) => {
                  const selected =
                    editedData?.availableSkills?.includes(skill.id) ?? false;

                  return (
                    <TouchableOpacity
                      key={skill.id}
                      activeOpacity={0.7}
                      style={[
                        styles.skillOption,
                        selected && styles.skillOptionSelected,
                      ]}
                      onPress={() => toggleSkill(skill.id)}
                    >
                      {/* Check for whichever property exists on the service object */}
                      {skill.service?.imagePath || skill.service?.imagepath ? (
                        <Image
                          source={{
                            uri: (() => {
                              const path = (
                                skill.service.imagePath ||
                                skill.service.imagepath ||
                                ""
                              ).trim();
                              return path.startsWith("data:")
                                ? path
                                : `data:image/jpeg;base64,${path}`;
                            })(),
                          }}
                          style={styles.serviceImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[styles.serviceImage, styles.imagePlaceholder]}
                        >
                          <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                      )}

                      <View style={styles.skillOptionInfo}>
                        <Text style={styles.skillOptionText}>
                          {skill.service?.emri_sherbimit ?? `Skill ${skill.id}`}
                        </Text>

                        {skill.service?.qmimi_baze != null && (
                          <Text style={styles.skillOptionPrice}>
                            €{skill.service.qmimi_baze}
                          </Text>
                        )}
                      </View>

                      <View
                        style={[
                          styles.checkbox,
                          selected && styles.checkboxSelected,
                        ]}
                      >
                        {selected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.8}
                onPress={() => setShowSkillPicker(false)}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  innerSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  loading: {
    color: "#64748B",
    fontStyle: "italic",
  },
  cardGroupOuter: {
    marginBottom: 10,
  },
  currentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardActiveShadow: {
    borderColor: "#C7D2FE",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  skillsSelectButton: {
    marginTop: 16,
  },
  editContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  /* --- NEW TAB BAR STYLES --- */
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 7,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  tabContent: {
    width: "100%",
  },
  /* --------------------------- */
  editDayCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  dayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  currentDetailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  detailBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4F46E5",
    marginTop: 6,
    marginRight: 8,
  },
  dayNameActive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  detailTimeText: {
    fontSize: 13,
    color: "#334155",
    marginTop: 2,
  },
  breakText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 13,
  },
  setupToggleFormButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  setupToggleFormButtonActive: {
    borderColor: "#818CF8",
    backgroundColor: "#EEF2FF",
  },
  setupToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  setupToggleSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  formContainer: {
    marginTop: 16,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardActiveBorder: {
    borderColor: "#818CF8",
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  cellLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  statusSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  dayContent: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 6,
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
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  skillsListContainer: {
    marginTop: 16,
    gap: 12,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceCardSelected: {
    borderColor: "#4F46E5",
    borderWidth: 2,
    backgroundColor: "#F5F3FF",
  },
  serviceMainRow: {
    flexDirection: "row",
    gap: 12,
  },
  serviceImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceContent: {
    flex: 1,
    justifyContent: "center",
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  serviceDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
  },
  originalPriceText: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
  },
  attributesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  attributesSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  attributeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  attributeMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attributeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attributeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  attributeDuration: {
    fontSize: 11,
    color: "#64748B",
  },
  attributePriceContainer: {
    alignItems: "flex-end",
  },
  attributePrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  attributeOriginalPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  attributeDescription: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  skillsContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  skillsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  countBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: "auto",
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  servicesList: {
    gap: 10,
  },
  serviceImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  priceBadge: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  skillsSection: {
    marginTop: 4,
  },
  addSkillButton: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  addSkillButtonText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "600",
  },
  noSkillsText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  /* --- ADDED SKILL ITEM STYLES --- */
  skillImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  skillInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  skillName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  skillPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 2,
  },
  /* ------------------------------- */
  removeSkillButton: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  removeSkillText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "600",
  },

  /* --- MODAL STYLES --- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  skillModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "80%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  skillOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  skillOptionSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  skillOptionImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  skillOptionImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  placeholderText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
  },
  skillOptionInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  skillOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  skillOptionTextSelected: {
    color: "#4338CA",
  },
  skillOptionPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
