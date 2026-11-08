import { COLORS, RADIUS, SERIF } from "@/constants/theme";
import {
  cancelTermin,
  completeTermin,
  getTerminet,
  updateTermin,
} from "@/javascript/employees/TerminetAPI";
import { subscribeEmployeeAppointments } from "@/javascript/WebSocketClientConnection";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Types ---
interface Attribute {
  id?: number;
  emri?: string;
  pershkrimi?: string;
  kohezgjatja?: number;
  qmimi_baze?: number;
  [key: string]: any;
}

interface Service {
  ID: number;
  emri_sherbimit: string;
  kohezgjatja: number;
  qmimi_baze: number;
  zbritja: number;
  imagePath?: string | null;
  atributet?: Attribute[] | null;
}

interface AppointmentDetail {
  id_detajet_termineve: number;
  id_terminit: number;
  kohezgjatja: number;
  pagesa: number;
  atributet?: Attribute[] | null;
  sherbimet: Service;
}

interface Appointment {
  id_terminit: number;
  employee_id: number;
  client: {
    ID: number;
    emri: string;
    mbiemri: string;
    numri_telefonit: string;
    email: string;
    pershkrimi: string | null;
  };
  data_caktimit: string;
  pershkrimi: string;
  /** Optional: adjust to whatever your backend sends */
  statusi?: string | null;
  detajet_terminit: AppointmentDetail[];
}

type Status = "pending" | "completed" | "cancelled";

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

// Maps whatever the backend sends to one of three states.
const getStatus = (a: Appointment): Status => {
  const s = (a.statusi || "").toLowerCase();
  if (s.includes("anul") || s.includes("cancel")) return "cancelled";
  if (s.includes("perfund") || s.includes("përfund") || s.includes("complet"))
    return "completed";
  return "pending";
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Në pritje",
  completed: "Përfunduar",
  cancelled: "Anuluar",
};

const pad = (n: number) => String(n).padStart(2, "0");
const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function Terminet() {
  const insets = useSafeAreaInsets();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedDetailIds, setExpandedDetailIds] = useState<number[]>([]);

  // Details sheet
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editNote, setEditNote] = useState("");
  const [busy, setBusy] = useState(false);

  const selected =
    appointments.find((a) => a.id_terminit === selectedId) ?? null;

  useFocusEffect(
    useCallback(() => {
      let subscription: { unsubscribe: () => void } | null = null;

      const setup = async () => {
        try {
          setLoading(true);
          await loadTerminet();
          subscription = await subscribeEmployeeAppointments(
            (updatedAppointments: Appointment[]) => {
              setAppointments(updatedAppointments);
            },
          );
        } catch (error) {
          console.error("Terminet setup error:", error);
        } finally {
          setLoading(false);
        }
      };

      setup();

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }, []),
  );

  const loadTerminet = async () => {
    try {
      setLoading(true);
      const data = await getTerminet();
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceExpand = (detailId: number) => {
    setExpandedDetailIds((prev) =>
      prev.includes(detailId)
        ? prev.filter((id) => id !== detailId)
        : [...prev, detailId],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sq-AL", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getImageSource = (imagePath?: string | null) => {
    if (!imagePath || typeof imagePath !== "string") return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return { uri: imagePath };
    }
    if (imagePath.startsWith("data:image")) {
      return { uri: imagePath };
    }
    const cleanBase64 = imagePath.trim();
    if (cleanBase64.length > 0) {
      return { uri: `data:image/png;base64,${cleanBase64}` };
    }
    return null;
  };

  const calculateTotal = (details: AppointmentDetail[]) =>
    details.reduce((sum, item) => sum + item.pagesa, 0);

  const calculateDuration = (details: AppointmentDetail[]) =>
    details.reduce((sum, item) => sum + (item.kohezgjatja || 0), 0);

  // ---------- Sheet open / close ----------

  const openDetails = (a: Appointment) => {
    setSelectedId(a.id_terminit);
    setIsModifying(false);
  };

  const closeDetails = () => {
    setSelectedId(null);
    setIsModifying(false);
    setBusy(false);
  };

  const startModify = (a: Appointment) => {
    const d = new Date(a.data_caktimit);
    setEditDate(isNaN(d.getTime()) ? new Date() : d);
    setEditNote(a.pershkrimi || "");
    setIsModifying(true);
  };

  // ---------- Actions ----------

  const patchLocal = (id: number, patch: Partial<Appointment>) =>
    setAppointments((prev) =>
      prev.map((a) => (a.id_terminit === id ? { ...a, ...patch } : a)),
    );

  const confirmComplete = (a: Appointment) => {
    Alert.alert(
      "Përfundo terminin",
      `Të shënohet si i përfunduar termini i ${a.client.emri} ${a.client.mbiemri}?`,
      [
        { text: "Jo", style: "cancel" },
        {
          text: "Përfundo",
          onPress: async () => {
            try {
              setBusy(true);
              await completeTermin(a.id_terminit);
              patchLocal(a.id_terminit, { statusi: "completed" });
            } catch (e) {
              console.error(e);
              Alert.alert("Gabim", "Termini nuk u përfundua. Provoni përsëri.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const confirmCancel = (a: Appointment) => {
    Alert.alert(
      "Anulo terminin",
      `Të anulohet termini i ${a.client.emri} ${a.client.mbiemri}? Ky veprim nuk kthehet.`,
      [
        { text: "Jo", style: "cancel" },
        {
          text: "Anulo terminin",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await cancelTermin(a.id_terminit);
              patchLocal(a.id_terminit, { statusi: "cancelled" });
            } catch (e) {
              console.error(e);
              Alert.alert("Gabim", "Termini nuk u anulua. Provoni përsëri.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const saveModify = async (a: Appointment) => {
    try {
      setBusy(true);
      const iso = editDate.toISOString();
      await updateTermin(a.id_terminit, {
        data_caktimit: iso,
        pershkrimi: editNote.trim(),
      });
      patchLocal(a.id_terminit, {
        data_caktimit: iso,
        pershkrimi: editNote.trim(),
      });
      setIsModifying(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Gabim", "Ndryshimet nuk u ruajtën. Provoni përsëri.");
    } finally {
      setBusy(false);
    }
  };

  // ---------- Summary card ----------

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const status = getStatus(item);
    const d = new Date(item.data_caktimit);
    const valid = !isNaN(d.getTime());
    const total = calculateTotal(item.detajet_terminit);
    const names = item.detajet_terminit
      .map((x) => x.sherbimet.emri_sherbimit)
      .join(", ");

    return (
      <Pressable
        onPress={() => openDetails(item)}
        style={({ pressed }) => [
          styles.card,
          status !== "pending" && styles.cardMuted,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Shiko detajet e terminit të ${item.client.emri} ${item.client.mbiemri}`}
      >
        <View style={styles.dateRail}>
          <Text style={styles.dateRailDay}>{valid ? d.getDate() : "–"}</Text>
          <Text style={styles.dateRailMonth}>
            {valid ? MONTHS_SHORT[d.getMonth()] : ""}
          </Text>
          <View style={styles.railDivider} />
          <Text style={styles.dateRailTime}>{valid ? formatTime(d) : ""}</Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.cardTopRow}>
            <Text style={styles.clientName} numberOfLines={1}>
              {item.client.emri} {item.client.mbiemri}
            </Text>
            <View
              style={[
                styles.statusPill,
                status === "completed" && styles.statusCompleted,
                status === "cancelled" && styles.statusCancelled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status === "completed" && { color: COLORS.green },
                  status === "cancelled" && { color: COLORS.red },
                ]}
              >
                {STATUS_LABEL[status]}
              </Text>
            </View>
          </View>

          <Text style={styles.servicesPreview} numberOfLines={1}>
            {names || "Pa shërbime"}
          </Text>

          <View style={styles.cardBottomRow}>
            <Text style={styles.metaText}>
              {item.detajet_terminit.length} shërbime ·{" "}
              {calculateDuration(item.detajet_terminit)} min
            </Text>
            <Text style={styles.cardTotal}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.light} />
      </Pressable>
    );
  };

  // ---------- Details sheet ----------

  const renderDetailsBody = (a: Appointment) => {
    const status = getStatus(a);
    const total = calculateTotal(a.detajet_terminit);

    return (
      <>
        {/* Client */}
        <View style={styles.sheetClient}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(a.client.emri?.[0] || "").toUpperCase()}
              {(a.client.mbiemri?.[0] || "").toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetClientName}>
              {a.client.emri} {a.client.mbiemri}
            </Text>
            <View style={styles.datePill}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={COLORS.green}
              />
              <Text style={styles.datePillText}>
                {formatDate(a.data_caktimit)}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.infoGroup}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={COLORS.green} />
            <Text style={styles.infoText}>{a.client.numri_telefonit}</Text>
          </View>
          {a.client.email ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Ionicons name="mail-outline" size={16} color={COLORS.green} />
              <Text style={styles.infoText}>{a.client.email}</Text>
            </View>
          ) : null}
          {a.pershkrimi ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={COLORS.green}
              />
              <Text style={styles.infoText}>{a.pershkrimi}</Text>
            </View>
          ) : null}
        </View>

        {/* Services */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>SHËRBIMET</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {a.detajet_terminit.length}
            </Text>
          </View>
        </View>

        <View style={styles.servicesList}>
          {a.detajet_terminit.map((detail) => {
            const service = detail.sherbimet;
            const hasDiscount = service.zbritja > 0;
            const imageSrc = getImageSource(service.imagePath);
            const attributesList = detail.atributet || service.atributet || [];
            const isExpanded = expandedDetailIds.includes(
              detail.id_detajet_termineve,
            );

            return (
              <View
                key={detail.id_detajet_termineve}
                style={styles.skillRowContainer}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={attributesList.length === 0}
                  onPress={() =>
                    toggleServiceExpand(detail.id_detajet_termineve)
                  }
                  style={styles.skillRow}
                >
                  {imageSrc ? (
                    <Image source={imageSrc} style={styles.serviceImage} />
                  ) : (
                    <View style={styles.skillImagePlaceholder}>
                      <Ionicons
                        name="construct-outline"
                        size={20}
                        color={COLORS.green}
                      />
                    </View>
                  )}

                  <View style={styles.skillInfo}>
                    <Text style={styles.skillName}>
                      {service.emri_sherbimit}
                    </Text>
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={COLORS.muted}
                      />
                      <Text style={styles.metaText}>
                        {detail.kohezgjatja} min
                      </Text>
                    </View>
                    {attributesList.length > 0 && (
                      <View style={styles.metaRow}>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={12}
                          color={COLORS.green}
                        />
                        <Text style={styles.attributesToggleText}>
                          {isExpanded ? "Fshih Atributet" : "Shfaq Atributet"}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.attributePriceContainer}>
                    <Text style={styles.skillPrice}>
                      {detail.pagesa.toFixed(2)} €
                    </Text>
                    {hasDiscount && (
                      <Text style={styles.attributeOriginalPrice}>
                        {service.qmimi_baze.toFixed(2)} €
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.attributesSection}>
                    {attributesList.map((attr, idx) => (
                      <View key={attr.id || idx} style={styles.attributeCard}>
                        <View style={styles.attributeMainInfo}>
                          <View style={styles.attributeLeft}>
                            <Text style={styles.attributeName}>
                              {attr.emri || `Atributi #${idx + 1}`}
                            </Text>
                            {attr.kohezgjatja ? (
                              <Text style={styles.attributeDuration}>
                                ({attr.kohezgjatja} min)
                              </Text>
                            ) : null}
                          </View>
                          {attr.qmimi_baze !== undefined && (
                            <Text style={styles.attributePrice}>
                              +{attr.qmimi_baze.toFixed(2)} €
                            </Text>
                          )}
                        </View>
                        {attr.pershkrimi ? (
                          <Text style={styles.attributeDescription}>
                            {attr.pershkrimi}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>ÇMIMI TOTAL</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
        </View>

        {/* Actions */}
        {status === "pending" ? (
          <View style={styles.actionsWrap}>
            <Pressable
              style={[styles.primaryAction, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => confirmComplete(a)}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={COLORS.surface}
              />
              <Text style={styles.primaryActionText}>Përfundo terminin</Text>
            </Pressable>

            <View style={styles.secondaryRow}>
              <Pressable
                style={[styles.secondaryAction, busy && { opacity: 0.6 }]}
                disabled={busy}
                onPress={() => startModify(a)}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={COLORS.green}
                />
                <Text style={[styles.secondaryActionText, { color: COLORS.green }]}>
                  Ndrysho
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.secondaryAction,
                  styles.dangerAction,
                  busy && { opacity: 0.6 },
                ]}
                disabled={busy}
                onPress={() => confirmCancel(a)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={COLORS.red}
                />
                <Text style={[styles.secondaryActionText, { color: COLORS.red }]}>
                  Anulo
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.finalNote}>
            <Ionicons
              name={
                status === "completed"
                  ? "checkmark-circle"
                  : "close-circle"
              }
              size={18}
              color={status === "completed" ? COLORS.green : COLORS.red}
            />
            <Text style={styles.finalNoteText}>
              Ky termin është {STATUS_LABEL[status].toLowerCase()}.
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderModifyBody = (a: Appointment) => (
    <>
      <Text style={styles.sheetTitle}>Ndrysho terminin</Text>
      <Text style={styles.sheetSubtitle}>
        {a.client.emri} {a.client.mbiemri}
      </Text>

      <View style={styles.editCard}>
        <View style={styles.editRow}>
          <View style={styles.editLabelWrap}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.green} />
            <Text style={styles.editLabel}>Data</Text>
          </View>
          <DateTimePicker
            value={editDate}
            mode="date"
            display="compact"
            onChange={(_, d) => {
              if (!d) return;
              const next = new Date(editDate);
              next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              setEditDate(next);
            }}
          />
        </View>
        <View style={[styles.editRow, styles.infoRowBorder]}>
          <View style={styles.editLabelWrap}>
            <Ionicons name="time-outline" size={16} color={COLORS.green} />
            <Text style={styles.editLabel}>Ora</Text>
          </View>
          <DateTimePicker
            value={editDate}
            mode="time"
            display="compact"
            is24Hour={true}
            onChange={(_, d) => {
              if (!d) return;
              const next = new Date(editDate);
              next.setHours(d.getHours(), d.getMinutes(), 0, 0);
              setEditDate(next);
            }}
          />
        </View>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 18, marginBottom: 8 }]}>
        SHËNIM
      </Text>
      <TextInput
        value={editNote}
        onChangeText={setEditNote}
        placeholder="Shto një shënim për terminin"
        placeholderTextColor={COLORS.light}
        multiline
        style={styles.noteInput}
      />

      <View style={styles.secondaryRow}>
        <Pressable
          style={[styles.secondaryAction, styles.ghostAction]}
          disabled={busy}
          onPress={() => setIsModifying(false)}
        >
          <Text style={[styles.secondaryActionText, { color: COLORS.muted }]}>
            Anulo
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryAction,
            styles.saveAction,
            busy && { opacity: 0.6 },
          ]}
          disabled={busy}
          onPress={() => saveModify(a)}
        >
          {busy ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={[styles.secondaryActionText, { color: COLORS.surface }]}>
              Ruaj ndryshimet
            </Text>
          )}
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header band */}
        <View style={[styles.headerZone, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => router.push("/Home")}
              accessibilityRole="button"
              accessibilityLabel="Kthehu"
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.goldLight} />
            </Pressable>
          </View>

          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Terminet e caktuara</Text>
          </View>
          <Text style={styles.headerTitle}>Terminet</Text>
          <Text style={styles.headerTitleSerif}>tuaja</Text>
        </View>

        {/* Body overlaps the header */}
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator
              color={COLORS.green}
              size="large"
              style={{ marginTop: 40 }}
            />
          ) : (
            <FlatList
              data={appointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => item.id_terminit.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.noSkillsText}>
                    Nuk ka termine të caktuara.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Details / modify sheet */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => (isModifying ? setIsModifying(false) : closeDetails())}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={closeDetails} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              ]}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTopBar}>
                <Text style={styles.sheetEyebrow}>
                  {isModifying ? "Modifikim" : "Detajet e terminit"}
                </Text>
                <TouchableOpacity
                  onPress={closeDetails}
                  style={styles.closeCircle}
                  accessibilityLabel="Mbyll"
                >
                  <Ionicons name="close" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {selected &&
                  (isModifying
                    ? renderModifyBody(selected)
                    : renderDetailsBody(selected))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  contentContainer: { paddingBottom: 48 },

  /* Header band */
  headerZone: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 22,
    paddingBottom: 74,
  },
  headerTopRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  backButtonPressed: { transform: [{ scale: 0.92 }] },
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
  body: { marginHorizontal: 12, marginTop: -34 },

  /* Summary card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: RADIUS.card,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardMuted: { opacity: 0.72 },
  cardPressed: { transform: [{ scale: 0.99 }], borderColor: COLORS.goldSoft },
  dateRail: {
    width: 58,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.black,
  },
  dateRailDay: {
    fontFamily: SERIF,
    fontSize: 24,
    lineHeight: 26,
    color: COLORS.cream,
  },
  dateRailMonth: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: COLORS.goldSoft,
  },
  railDivider: {
    width: 22,
    height: 1,
    marginVertical: 6,
    backgroundColor: "rgba(182,150,99,0.5)",
  },
  dateRailTime: { fontSize: 12, fontWeight: "700", color: COLORS.cream },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  clientName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.goldSoft,
    backgroundColor: COLORS.cream,
  },
  statusCompleted: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.infoBorder,
  },
  statusCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  statusText: { fontSize: 10, fontWeight: "700", color: COLORS.gold },
  servicesPreview: { fontSize: 13, color: COLORS.muted },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cardTotal: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  /* Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 19, 17, 0.58)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "88%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: COLORS.creamDark,
    marginBottom: 12,
  },
  sheetTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetEyebrow: {
    fontFamily: SERIF,
    fontSize: 18,
    color: COLORS.black,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.6,
    color: COLORS.text,
  },
  sheetSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  sheetClient: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.green,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: SERIF,
    fontSize: 20,
    color: COLORS.cream,
  },
  sheetClientName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  datePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.greenLight,
  },
  datePillText: { color: COLORS.green, fontSize: 12, fontWeight: "700" },

  infoGroup: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  infoText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20 },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.green,
  },
  countBadgeText: { color: COLORS.goldLight, fontSize: 11, fontWeight: "800" },
  servicesList: { gap: 10 },
  skillRowContainer: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  serviceImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.creamDark,
  },
  skillImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.greenLight,
    justifyContent: "center",
    alignItems: "center",
  },
  skillInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  skillName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  metaText: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  attributesToggleText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "700",
  },
  attributePriceContainer: { alignItems: "flex-end" },
  skillPrice: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  attributeOriginalPrice: {
    color: COLORS.light,
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  attributesSection: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },
  attributeCard: {
    marginBottom: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  attributeMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attributeLeft: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attributeName: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  attributeDuration: { color: COLORS.muted, fontSize: 11 },
  attributePrice: { color: COLORS.green, fontSize: 13, fontWeight: "700" },
  attributeDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.greenLight,
  },
  totalLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  totalValue: {
    color: COLORS.green,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.9,
  },

  /* Actions */
  actionsWrap: { marginTop: 16, gap: 10 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green,
  },
  primaryActionText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
    backgroundColor: COLORS.greenLight,
  },
  dangerAction: {
    borderColor: COLORS.dangerBorder,
    backgroundColor: COLORS.dangerBg,
  },
  ghostAction: {
    borderColor: COLORS.creamDark,
    backgroundColor: COLORS.cream,
  },
  saveAction: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  secondaryActionText: { fontSize: 14, fontWeight: "700" },
  finalNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  finalNoteText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },

  /* Modify */
  editCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  editLabel: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  noteInput: {
    minHeight: 88,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(36, 72, 58, 0.22)",
    borderRadius: 20,
    backgroundColor: COLORS.cream,
  },
  noSkillsText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});