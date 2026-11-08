import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, RADIUS, SERIF } from "@/constants/theme";
import {
  deleteDate,
  getAvailability,
  setAvailableDates,
  updateDates,
} from "@/javascript/employees/AvailableDates";
import { getSkills } from "@/javascript/employees/skillsAPI";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  short: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  pause_start: string;
  pause_end: string;
}

type TimeField = "start_time" | "end_time" | "pause_start" | "pause_end";

// --- Constants & Static Helpers ---
const WEEK_DAYS = [
  { id: 1, name: "E Hënë", short: "Hën" },
  { id: 2, name: "E Martë", short: "Mar" },
  { id: 3, name: "E Mërkurë", short: "Mër" },
  { id: 4, name: "E Enjte", short: "Enj" },
  { id: 5, name: "E Premte", short: "Pre" },
  { id: 6, name: "E Shtunë", short: "Sht" },
  { id: 7, name: "E Diel", short: "Die" },
];

const DAY_NAMES: Record<number, string> = Object.fromEntries(
  WEEK_DAYS.map((d) => [d.id, d.name]),
);

const MONTHS_SHORT = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

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

// Accepts "YYYY-MM-DD" or a full ISO string
const parseAnyDate = (dateStr: string) => {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return parseDateOnlyString(dateStr.slice(0, 10));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : normalizeToMidnight(d);
};

const dayCount = (start: Date, end: Date) =>
  Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

const getStatus = (item: AvailabilityItem) => {
  const today = normalizeToMidnight(new Date());
  const s = parseAnyDate(item.start_date);
  const e = parseAnyDate(item.end_date);
  if (today < s) return { label: "Në pritje", tone: "gold" as const };
  if (today > e) return { label: "Skaduar", tone: "muted" as const };
  return { label: "Aktive", tone: "green" as const };
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

// --- Small reusable pieces ---

function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulse }]}>
      <View style={styles.skeletonDate} />
      <View style={{ flex: 1 }}>
        <View style={[styles.skeletonLine, { width: "55%" }]} />
        <View
          style={[
            styles.skeletonLine,
            { width: "80%", height: 9, marginTop: 10 },
          ]}
        />
      </View>
    </Animated.View>
  );
}

/** Mon–Sun strip. Filled = active day. */
function WeekStrip({ active }: { active: number[] }) {
  return (
    <View style={styles.weekStrip}>
      {WEEK_DAYS.map((d) => {
        const on = active.includes(d.id);
        return (
          <View key={d.id} style={[styles.weekCell, on && styles.weekCellOn]}>
            <Text style={[styles.weekCellText, on && styles.weekCellTextOn]}>
              {d.short.slice(0, 1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SegmentTabs({
  value,
  onChange,
  skillsCount,
}: {
  value: string;
  onChange: (v: string) => void;
  skillsCount: number;
}) {
  const tabs = [
    { key: "days", label: "Orari", icon: "time-outline" as const },
    {
      key: "skills",
      label: `Shërbimet (${skillsCount})`,
      icon: "sparkles-outline" as const,
    },
  ];
  return (
    <View style={styles.segment}>
      {tabs.map((t) => {
        const on = value === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={[styles.segmentBtn, on && styles.segmentBtnOn]}
            onPress={() => onChange(t.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={t.icon}
              size={14}
              color={on ? COLORS.green : COLORS.muted}
            />
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TimeCell({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.timeCell}>
      <Text style={styles.timeLabel}>{label}</Text>
      <DateTimePicker
        value={parseTimeString(value)}
        mode="time"
        display="compact"
        is24Hour={true}
        minimumDate={min ? parseTimeString(min) : undefined}
        maximumDate={max ? parseTimeString(max) : undefined}
        onChange={(_, date) => date && onChange(formatTimeString(date))}
      />
    </View>
  );
}

/** Work hours + break, shared by edit mode and the new-availability form */
function TimeBlock({
  value,
  onChange,
}: {
  value: {
    start_time: string;
    end_time: string;
    pause_start?: string;
    pause_end?: string;
  };
  onChange: (field: TimeField, v: string) => void;
}) {
  const ps = value.pause_start || "12:00";
  const pe = value.pause_end || "13:00";
  return (
    <View>
      <View style={styles.groupHeader}>
        <Ionicons name="briefcase-outline" size={13} color={COLORS.green} />
        <Text style={styles.groupLabel}>Puna</Text>
      </View>
      <View style={styles.timeRow}>
        <TimeCell
          label="Fillon"
          value={value.start_time}
          max={value.end_time}
          onChange={(v) => onChange("start_time", v)}
        />
        <TimeCell
          label="Përfundon"
          value={value.end_time}
          min={value.start_time}
          onChange={(v) => onChange("end_time", v)}
        />
      </View>

      <View style={[styles.groupHeader, { marginTop: 14 }]}>
        <Ionicons name="cafe-outline" size={13} color={COLORS.green} />
        <Text style={styles.groupLabel}>Pushimi</Text>
      </View>
      <View style={styles.timeRow}>
        <TimeCell
          label="Nga"
          value={ps}
          min={value.start_time}
          max={pe}
          onChange={(v) => onChange("pause_start", v)}
        />
        <TimeCell
          label="Deri"
          value={pe}
          min={ps}
          max={value.end_time}
          onChange={(v) => onChange("pause_end", v)}
        />
      </View>
    </View>
  );
}

function ServiceThumb({ uri, size = 44 }: { uri?: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 12 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={[
        styles.thumbPlaceholder,
        { width: size, height: size, borderRadius: 12 },
      ]}
    >
      <Ionicons name="construct-outline" size={size * 0.42} color={COLORS.green} />
    </View>
  );
}

// --- Main Component ---
export default function Availability() {
  const insets = useSafeAreaInsets();
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
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
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("days"); // 'days' or 'skills'
  const [skills, setSkills] = useState<EmployeeService[]>([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

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

  const toggleSkillSelection = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAvailability();
    setRefreshing(false);
  }, []);

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
        .filter((day) => day.enabled && availableDays.includes(day.id))
        .map((day) => ({
          day_of_week: day.id,
          start_time: day.start_time,
          end_time: day.end_time,
          pause_start: day.pause_start,
          pause_end: day.pause_end,
        })),
      availableSkills: selectedSkillIds,
    };

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

  const updateEditedDetail = (index: number, field: TimeField, v: string) => {
    setEditedData((prev) => {
      if (!prev) return prev;
      const details = [...prev.availabilityDetails];
      details[index] = { ...details[index], [field]: v };
      return { ...prev, availabilityDetails: details };
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
            ? { ...item, ...editedData }
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

  const hasConflict = (from: Date, to: Date) => {
    const current = new Date(from.getTime());
    while (current <= to) {
      if (isDateOccupied(current, availability)) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  const showConflictAlert = () =>
    Alert.alert(
      "Lodhje e padisponueshme",
      "Lodhja e përzgjedhur përmban data që janë tashmë të zëna.",
    );

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed" || !selectedDate) return;

    const cleanStart = normalizeToMidnight(selectedDate);
    const targetEnd = cleanStart > endDate ? cleanStart : endDate;

    if (hasConflict(cleanStart, targetEnd)) return showConflictAlert();

    setStartDate(cleanStart);
    if (cleanStart > endDate) setEndDate(cleanStart);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed" || !selectedDate) return;

    const cleanEnd = normalizeToMidnight(selectedDate);
    if (hasConflict(startDate, cleanEnd)) return showConflictAlert();

    setEndDate(cleanEnd);
  };

  const toggleSkill = (skillId: number) => {
    setEditedData((prev) => {
      if (!prev) return prev;

      const currentSkills = prev.availableSkills ?? [];
      const isSelected = currentSkills.includes(skillId);
      const selectedSkill = skills.find((s) => s.id === skillId);
      if (!selectedSkill) return prev;

      if (isSelected) {
        return {
          ...prev,
          availableSkills: currentSkills.filter((id) => id !== skillId),
          sherbimetDisplay: (prev.sherbimetDisplay ?? []).filter(
            (service) => service.avaSkillId !== skillId,
          ),
        };
      }

      const serviceDetail: ServiceDetail = {
        ...selectedSkill.service,
        avaSkillId: skillId,
      };

      return {
        ...prev,
        availableSkills: [...currentSkills, skillId],
        sherbimetDisplay: [...(prev.sherbimetDisplay ?? []), serviceDetail],
      };
    });
  };

  const enabledDays = days.filter(
    (d) => d.enabled && availableDays.includes(d.id),
  );

  // ---------- Render helpers: current availability ----------

  const renderDateBlock = (dateStr: string) => {
    const d = parseAnyDate(dateStr);
    return (
      <View style={styles.dateBlock}>
        <Text style={styles.dateBlockDay}>{d.getDate()}</Text>
        <Text style={styles.dateBlockMonth}>{MONTHS_SHORT[d.getMonth()]}</Text>
      </View>
    );
  };

  const renderReadOnly = (item: AvailabilityItem) => (
    <View style={styles.cardBody}>
      <SegmentTabs
        value={activeTab}
        onChange={setActiveTab}
        skillsCount={item.sherbimetDisplay?.length || 0}
      />

      {activeTab === "days" && (
        <View>
          {item.availabilityDetails.map((d, index) => {
            const hasBreak = d.pause_start && d.pause_end;
            return (
              <View
                key={index}
                style={[styles.scheduleRow, index === 0 && styles.noTopLine]}
              >
                <View style={styles.scheduleDay}>
                  <Text style={styles.scheduleDayText}>
                    {WEEK_DAYS[d.day_of_week - 1]?.short}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleTime}>
                    {d.start_time.slice(0, 5)} – {d.end_time.slice(0, 5)}
                  </Text>
                  {hasBreak && (
                    <View style={styles.breakRow}>
                      <Ionicons
                        name="cafe-outline"
                        size={11}
                        color={COLORS.muted}
                      />
                      <Text style={styles.breakText}>
                        {d.pause_start!.slice(0, 5)} –{" "}
                        {d.pause_end!.slice(0, 5)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {activeTab === "skills" && (
        <View style={{ gap: 8 }}>
          {item.sherbimetDisplay && item.sherbimetDisplay.length > 0 ? (
            item.sherbimetDisplay.map((s) => (
              <View key={s.ID} style={styles.serviceRow}>
                <ServiceThumb uri={s.imagePath} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceRowName} numberOfLines={1}>
                    {s.emri_sherbimit}
                  </Text>
                  <Text style={styles.serviceRowMeta}>{s.kohezgjatja} min</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagText}>{s.qmimi_baze} €</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyInline}>Nuk ka shërbime të caktuara.</Text>
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnEdit]}
          onPress={() => startEditing(item)}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.green} />
          <Text style={[styles.actionBtnText, { color: COLORS.green }]}>
            Ndrysho
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnDelete]}
          onPress={() => deleteAvailability(item.id_availability)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.red} />
          <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Fshi</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEditing = () => (
    <View style={styles.cardBody}>
      <SegmentTabs
        value={activeTab}
        onChange={setActiveTab}
        skillsCount={editedData?.sherbimetDisplay?.length || 0}
      />

      {activeTab === "days" &&
        editedData?.availabilityDetails.map((d, index) => (
          <View key={index} style={styles.editDayCard}>
            <View style={styles.editDayTitle}>
              <View style={styles.scheduleDay}>
                <Text style={styles.scheduleDayText}>
                  {WEEK_DAYS[d.day_of_week - 1]?.short}
                </Text>
              </View>
              <Text style={styles.dayNameStrong}>{DAY_NAMES[d.day_of_week]}</Text>
            </View>
            <TimeBlock
              value={d}
              onChange={(field, v) => updateEditedDetail(index, field, v)}
            />
          </View>
        ))}

      {activeTab === "skills" && (
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            style={styles.addSkillButton}
            onPress={() => setShowSkillPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={COLORS.green} />
            <Text style={styles.addSkillButtonText}>Shto shërbim</Text>
          </TouchableOpacity>

          {editedData?.sherbimetDisplay?.length === 0 ? (
            <Text style={styles.emptyInline}>Asnjë shërbim i zgjedhur</Text>
          ) : (
            editedData?.sherbimetDisplay?.map((skill) => (
              <View key={skill.avaSkillId} style={styles.serviceRow}>
                <ServiceThumb uri={skill.imagePath} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceRowName} numberOfLines={1}>
                    {skill.emri_sherbimit}
                  </Text>
                  <Text style={styles.serviceRowMeta}>
                    {skill.qmimi_baze ?? 0} €
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => toggleSkill(skill.avaSkillId)}
                >
                  <Ionicons name="close" size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnGhost]}
          onPress={() => {
            setEditingAvailability(null);
            setEditedData(null);
          }}
        >
          <Text style={[styles.actionBtnText, { color: COLORS.muted }]}>
            Anulo
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={saveAvailability}
        >
          <Text style={[styles.actionBtnText, { color: COLORS.surface }]}>
            Ruaj Përditësimet
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderAvailabilityCard = (item: AvailabilityItem) => {
    const open = expandedSavedCard === item.id_availability;
    const isEditing = editingAvailability === item.id_availability;
    const status = getStatus(item);
    const start = parseAnyDate(item.start_date);
    const end = parseAnyDate(item.end_date);
    const activeDays = item.availabilityDetails.map((d) => d.day_of_week);

    return (
      <View
        key={item.id_availability}
        style={[styles.card, open && styles.cardOpen]}
      >
        <View
          style={[
            styles.cardAccent,
            status.tone === "green" && { backgroundColor: COLORS.green },
            status.tone === "gold" && { backgroundColor: COLORS.gold },
            status.tone === "muted" && { backgroundColor: COLORS.creamDark },
          ]}
        />

        <Pressable
          style={styles.cardHeader}
          onPress={() =>
            setExpandedSavedCard(open ? null : item.id_availability)
          }
        >
          <View style={styles.dateRail}>
            {renderDateBlock(item.start_date)}
            <View style={styles.railLine} />
            {renderDateBlock(item.end_date)}
          </View>

          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.metaTop}>
              <View
                style={[
                  styles.statusPill,
                  status.tone === "green" && styles.statusGreen,
                  status.tone === "gold" && styles.statusGold,
                  status.tone === "muted" && styles.statusMuted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    status.tone === "green" && { color: COLORS.green },
                    status.tone === "muted" && { color: COLORS.muted },
                  ]}
                >
                  {status.label}
                </Text>
              </View>
              <Text style={styles.durationText}>
                {dayCount(start, end)} ditë
              </Text>
            </View>

            <WeekStrip active={activeDays} />

            <Text style={styles.servicesCount}>
              {item.sherbimetDisplay?.length || 0} shërbime
            </Text>
          </View>

          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.light}
          />
        </Pressable>

        {open && (isEditing ? renderEditing() : renderReadOnly(item))}
      </View>
    );
  };

  // ---------- Render helpers: new availability ----------

  const renderDateTile = (
    label: string,
    date: Date,
    onChange: (e: any, d?: Date) => void,
    min?: Date,
  ) => (
    <View style={styles.dateTile}>
      <Text style={styles.dateTileLabel}>{label}</Text>
      <Text style={styles.dateTileDay}>{date.getDate()}</Text>
      <Text style={styles.dateTileMonth}>
        {MONTHS_SHORT[date.getMonth()]} {date.getFullYear()}
      </Text>
      <View style={styles.dateTilePicker}>
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          minimumDate={min}
          onChange={onChange}
        />
      </View>
    </View>
  );

  const renderNewForm = () => (
    <View style={styles.formContainer}>
      {/* PERIOD */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.green} />
          <Text style={styles.panelTitle}>Periudha</Text>
          <View style={styles.rangeChip}>
            <Text style={styles.rangeChipText}>
              {dayCount(startDate, endDate)} ditë
            </Text>
          </View>
        </View>

        <View style={styles.dateTiles}>
          {renderDateTile("Fillon", startDate, handleStartDateChange)}
          <View style={styles.tileArrow}>
            <Ionicons name="arrow-forward" size={16} color={COLORS.green} />
          </View>
          {renderDateTile("Përfundon", endDate, handleEndDateChange, startDate)}
        </View>
      </View>

      {/* WORKING DAYS */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Ionicons name="time-outline" size={18} color={COLORS.green} />
          <Text style={styles.panelTitle}>Ditët e punës</Text>
          <View style={styles.rangeChip}>
            <Text style={styles.rangeChipText}>{enabledDays.length} aktive</Text>
          </View>
        </View>

        <View style={styles.dayPicker}>
          {days.map((day) => {
            const inRange = availableDays.includes(day.id);
            return (
              <Pressable
                key={day.id}
                disabled={!inRange}
                onPress={() => {
                  updateDay(day.id, "enabled", !day.enabled);
                  if (!day.enabled) setExpanded(day.id);
                  else if (expanded === day.id) setExpanded(null);
                }}
                style={[
                  styles.dayCircle,
                  day.enabled && inRange && styles.dayCircleOn,
                  !inRange && styles.dayCircleOff,
                ]}
              >
                <Text
                  style={[
                    styles.dayCircleText,
                    day.enabled && inRange && styles.dayCircleTextOn,
                  ]}
                >
                  {day.short}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {enabledDays.length === 0 ? (
          <Text style={styles.hintText}>
            Prekni ditët e mësipërme për t'i aktivizuar dhe caktuar oraret.
          </Text>
        ) : (
          enabledDays.map((day) => {
            const isOpen = expanded === day.id;
            return (
              <View key={day.id} style={styles.dayRow}>
                <Pressable
                  style={styles.dayRowHead}
                  onPress={() => setExpanded(isOpen ? null : day.id)}
                >
                  <Text style={styles.dayRowName}>{day.name}</Text>
                  <View style={styles.dayRowTimes}>
                    <Text style={styles.dayRowTime}>
                      {day.start_time} – {day.end_time}
                    </Text>
                    <Text style={styles.dayRowBreak}>
                      pushim {day.pause_start}–{day.pause_end}
                    </Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={COLORS.light}
                  />
                </Pressable>

                {isOpen && (
                  <View style={styles.dayRowBody}>
                    <TimeBlock
                      value={day}
                      onChange={(field, v) => updateDay(day.id, field, v)}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* SERVICES */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Ionicons name="sparkles-outline" size={18} color={COLORS.green} />
          <Text style={styles.panelTitle}>Shërbimet</Text>
          <View style={styles.rangeChip}>
            <Text style={styles.rangeChipText}>
              {selectedSkillIds.length} zgjedhur
            </Text>
          </View>
        </View>

        {skills.length === 0 ? (
          <Text style={styles.hintText}>Nuk keni shërbime të regjistruara.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {skills.map((item) => {
              const selected = selectedSkillIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleSkillSelection(item.id)}
                  style={[styles.skillChip, selected && styles.skillChipOn]}
                >
                  <ServiceThumb uri={item.service?.imagePath} size={38} />
                  <View style={{ maxWidth: 110 }}>
                    <Text
                      style={[
                        styles.skillChipName,
                        selected && { color: COLORS.green },
                      ]}
                      numberOfLines={1}
                    >
                      {item.service?.emri_sherbimit}
                    </Text>
                    <Text style={styles.skillChipMeta}>
                      {item.service?.kohezgjatja} min
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={selected ? COLORS.green : COLORS.light}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Pressable style={styles.submitButton} onPress={setDates}>
        <Text style={styles.submitButtonText}>Ruaj Disponueshmërinë</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.green}
          colors={[COLORS.green]}
        />
      }
    >
      {/* Header */}
      <View style={[styles.headerZone, { paddingTop: insets.top + 24 }]}>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Orari Profesional</Text>
        </View>

        <View style={styles.heroIconRing}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="calendar-outline"
              size={32}
              color={COLORS.goldLight}
            />
          </View>
        </View>

        <Text style={styles.title}>Disponueshmëria</Text>
        <Text style={styles.headerSubtitle}>
          Menaxhoni oraret dhe shërbimet tuaja
        </Text>
      </View>

      <View style={styles.body}>
        {/* CURRENT AVAILABILITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponueshmëria Aktuale</Text>

          {loadingAvailability ? (
            <View style={{ gap: 10 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {availability.map(renderAvailabilityCard)}
            </View>
          )}

          {!loadingAvailability && availability.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={26}
                  color={COLORS.green}
                />
              </View>
              <Text style={styles.emptyTitle}>Asnjë disponueshmëri</Text>
              <Text style={styles.emptySubtitle}>
                Shtoni një periudhë të re për të filluar pranimin e termineve.
              </Text>
            </View>
          )}
        </View>

        {/* NEW AVAILABILITY */}
        <View style={styles.section}>
          <Pressable
            style={[styles.newTrigger, showSetupForm && styles.newTriggerOpen]}
            onPress={() => setShowSetupForm(!showSetupForm)}
          >
            <View style={styles.newTriggerIcon}>
              <Ionicons
                name={showSetupForm ? "remove" : "add"}
                size={22}
                color={COLORS.goldLight}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.newTriggerTitle}>
                Vendos Disponueshmëri të Re
              </Text>
              <Text style={styles.newTriggerSubtitle}>
                Përcaktoni datat, ditët aktive dhe oraret
              </Text>
            </View>
          </Pressable>

          {showSetupForm && renderNewForm()}
        </View>
      </View>

      {/* SKILL PICKER MODAL (edit mode) */}
      <Modal
        visible={showSkillPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSkillPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.skillModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shërbimet</Text>
              <Text style={styles.modalSubtitle}>
                Zgjidhni shërbimet për t'i caktuar
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {skills.map((skill) => {
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
                    <ServiceThumb uri={skill.service?.imagePath} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceRowName} numberOfLines={1}>
                        {skill.service?.emri_sherbimit ?? `Skill ${skill.id}`}
                      </Text>
                      {skill.service?.qmimi_baze != null && (
                        <Text style={styles.serviceRowMeta}>
                          {skill.service.qmimi_baze} €
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={selected ? COLORS.green : COLORS.light}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.8}
              onPress={() => setShowSkillPicker(false)}
            >
              <Text style={styles.closeButtonText}>Gati</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  contentContainer: { paddingBottom: 48 },

  /* Header (unchanged) */
  headerZone: {
    position: "relative",
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 22,
    paddingBottom: 72,
  },
  badgePill: {
    marginBottom: 18,
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
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  heroIconRing: {
    padding: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    borderRadius: 42,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "500",
    letterSpacing: -1,
    color: COLORS.cream,
    fontFamily: SERIF,
    textAlign: "center",
  },
  headerSubtitle: {
    marginTop: 7,
    color: COLORS.goldSoft,
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 15,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  body: { marginHorizontal: 12, marginTop: -34 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.cream,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  /* Skeleton + empty */
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
    padding: 16,
  },
  skeletonDate: {
    width: 56,
    height: 72,
    borderRadius: 14,
    backgroundColor: COLORS.creamDark,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: COLORS.creamDark,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
    borderStyle: "dashed",
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontFamily: SERIF, fontSize: 18, color: COLORS.black },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  emptyInline: {
    fontSize: 13,
    color: COLORS.light,
    fontStyle: "italic",
    paddingVertical: 8,
  },

  /* ---------- Current availability card ---------- */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
    overflow: "hidden",
  },
  cardOpen: {
    borderColor: COLORS.goldSoft,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardAccent: { height: 3, backgroundColor: COLORS.creamDark },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  dateRail: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    borderRadius: 14,
    paddingVertical: 8,
    width: 56,
  },
  dateBlock: { alignItems: "center" },
  dateBlockDay: {
    fontFamily: SERIF,
    fontSize: 22,
    lineHeight: 24,
    color: COLORS.cream,
  },
  dateBlockMonth: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.goldSoft,
    letterSpacing: 0.6,
  },
  railLine: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(182,150,99,0.5)",
    marginVertical: 5,
  },
  metaTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  statusGreen: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.infoBorder,
  },
  statusGold: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.goldSoft,
  },
  statusMuted: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.creamDark,
  },
  statusText: { fontSize: 11, fontWeight: "700", color: COLORS.gold },
  durationText: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  servicesCount: { fontSize: 12, color: COLORS.muted },

  weekStrip: { flexDirection: "row", gap: 4 },
  weekCell: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  weekCellOn: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  weekCellText: { fontSize: 10, fontWeight: "700", color: COLORS.light },
  weekCellTextOn: { color: COLORS.cream },

  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.creamDark,
    backgroundColor: COLORS.surface,
  },

  /* Segmented tabs */
  segment: {
    flexDirection: "row",
    backgroundColor: COLORS.greenLight,
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentBtnOn: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  segmentTextOn: { color: COLORS.green, fontWeight: "700" },

  /* Schedule rows (read-only) */
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cream,
  },
  noTopLine: { borderTopWidth: 0 },
  scheduleDay: {
    width: 40,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleDayText: { fontSize: 12, fontWeight: "800", color: COLORS.green },
  scheduleTime: { fontSize: 15, fontWeight: "600", color: COLORS.black },
  breakRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  breakText: { fontSize: 12, color: COLORS.muted },

  /* Services rows */
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    padding: 10,
  },
  serviceRowName: { fontSize: 14, fontWeight: "600", color: COLORS.black },
  serviceRowMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  priceTag: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  priceTagText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  thumbPlaceholder: {
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Card actions */
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  actionBtnEdit: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.infoBorder,
  },
  actionBtnDelete: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  actionBtnGhost: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.creamDark,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  actionBtnText: { fontSize: 13, fontWeight: "700" },

  /* Edit mode */
  editDayCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  editDayTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  dayNameStrong: { fontSize: 15, fontWeight: "700", color: COLORS.black },
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.gold,
    backgroundColor: COLORS.greenLight,
  },
  addSkillButtonText: { color: COLORS.green, fontSize: 13, fontWeight: "700" },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Shared time inputs */
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    letterSpacing: 0.4,
  },
  timeRow: { flexDirection: "row", gap: 10 },
  timeCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
  },
  timeLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },

  /* ---------- New availability ---------- */
  newTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.gold,
  },
  newTriggerOpen: {
    backgroundColor: COLORS.greenLight,
    borderStyle: "solid",
  },
  newTriggerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  newTriggerTitle: { fontFamily: SERIF, fontSize: 18, color: COLORS.black },
  newTriggerSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  formContainer: { marginTop: 14, gap: 14 },
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
    padding: 14,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  panelTitle: { flex: 1, fontFamily: SERIF, fontSize: 18, color: COLORS.black },
  rangeChip: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  rangeChipText: { fontSize: 11, fontWeight: "700", color: COLORS.green },

  /* Date tiles */
  dateTiles: { flexDirection: "row", alignItems: "center" },
  dateTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dateTileLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    letterSpacing: 0.6,
  },
  dateTileDay: {
    fontFamily: SERIF,
    fontSize: 42,
    lineHeight: 48,
    color: COLORS.black,
  },
  dateTileMonth: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  dateTilePicker: { alignItems: "center" },
  tileArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -6,
    zIndex: 1,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  /* Day picker */
  dayPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleOn: { backgroundColor: COLORS.green, borderColor: COLORS.gold },
  dayCircleOff: { opacity: 0.35 },
  dayCircleText: { fontSize: 11, fontWeight: "700", color: COLORS.muted },
  dayCircleTextOn: { color: COLORS.cream },
  hintText: { fontSize: 12, color: COLORS.muted, fontStyle: "italic" },

  dayRow: {
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.creamDark,
  },
  dayRowHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  dayRowName: { width: 82, fontSize: 14, fontWeight: "700", color: COLORS.black },
  dayRowTimes: { flex: 1 },
  dayRowTime: { fontSize: 13, fontWeight: "600", color: COLORS.green },
  dayRowBreak: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  dayRowBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.creamDark,
    backgroundColor: COLORS.surface,
  },

  /* Service chips */
  chipScroll: { gap: 10, paddingRight: 4 },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    borderWidth: 1.5,
    borderColor: COLORS.creamDark,
  },
  skillChipOn: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.green,
  },
  skillChipName: { fontSize: 13, fontWeight: "700", color: COLORS.black },
  skillChipMeta: { fontSize: 11, color: COLORS.muted, marginTop: 1 },

  submitButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    alignItems: "center",
  },
  submitButtonText: { color: COLORS.surface, fontWeight: "700", fontSize: 15 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 19, 17, 0.58)",
    justifyContent: "flex-end",
  },
  skillModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.creamDark,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: { marginBottom: 12 },
  modalTitle: { fontFamily: SERIF, fontSize: 22, color: COLORS.black },
  modalSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  skillOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.creamDark,
  },
  skillOptionSelected: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.gold,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    marginTop: 12,
  },
  closeButtonText: { color: COLORS.surface, fontSize: 15, fontWeight: "700" },
});