import { COLORS, RADIUS, SERIF } from "@/constants/theme";
import { getTerminet } from "@/javascript/employees/TerminetAPI";
import { subscribeEmployeeAppointments } from "@/javascript/WebSocketClientConnection";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  detajet_terminit: AppointmentDetail[];
}

export default function Terminet() {
  const insets = useSafeAreaInsets();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [expandedDetailIds, setExpandedDetailIds] = useState<number[]>([]);

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
        if (subscription) {
          subscription.unsubscribe();
        }
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

  // Resolves image paths (handles raw Base64, prefix base64, or http URLs)
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

  const calculateTotal = (details: AppointmentDetail[]) => {
    return details.reduce((sum, item) => sum + item.pagesa, 0);
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const totalAmount = calculateTotal(item.detajet_terminit);

    return (
      <View style={styles.cardGroupOuter}>
        <View style={styles.currentCard}>
          {/* Header Row: Client Name & Date */}
          <View style={styles.currentHeaderRow}>
            <Text style={styles.clientName} numberOfLines={2}>
              {item.client.emri} {item.client.mbiemri}
            </Text>
          </View>

          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.green} />
            <Text style={styles.datePillText}>
              {formatDate(item.data_caktimit)}
            </Text>
          </View>

          {/* Client Contact */}
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.muted} />
            <Text style={styles.breakText}>{item.client.numri_telefonit}</Text>
          </View>
          {item.client.email ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={COLORS.muted} />
              <Text style={styles.breakText}>{item.client.email}</Text>
            </View>
          ) : null}
          {item.pershkrimi ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>Shënim: {item.pershkrimi}</Text>
            </View>
          ) : null}

          {/* Services Section */}
          <View style={styles.skillsContainer}>
            <View style={styles.skillsHeader}>
              <Text style={styles.skillsTitle}>SHËRBIMET</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {item.detajet_terminit.length}
                </Text>
              </View>
            </View>

            <View style={styles.servicesList}>
              {item.detajet_terminit.map((detail) => {
                const service = detail.sherbimet;
                const hasDiscount = service.zbritja > 0;
                const finalPrice = detail.pagesa;
                const imageSrc = getImageSource(service.imagePath);

                // Get attributes from detail level or service level
                const attributesList =
                  detail.atributet || service.atributet || [];
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
                      onPress={() =>
                        toggleServiceExpand(detail.id_detajet_termineve)
                      }
                      style={styles.skillRow}
                    >
                      {/* Service Image */}
                      {imageSrc ? (
                        <Image source={imageSrc} style={styles.serviceImage} />
                      ) : (
                        <View style={styles.skillImagePlaceholder}>
                          <Text style={styles.placeholderText}>PA IZH</Text>
                        </View>
                      )}

                      {/* Service Info */}
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
                              {isExpanded
                                ? "Fshih Atributet"
                                : "Shfaq Atributet"}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Service Price */}
                      <View style={styles.attributePriceContainer}>
                        <Text style={styles.skillPrice}>
                          {finalPrice.toFixed(2)} €
                        </Text>
                        {hasDiscount && (
                          <Text style={styles.attributeOriginalPrice}>
                            {service.qmimi_baze.toFixed(2)} €
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Attributes List */}
                    {isExpanded && (
                      <View style={styles.attributesSection}>
                        <Text style={styles.attributesSectionTitle}>
                          ATRIBUTET
                        </Text>
                        {attributesList.length > 0 ? (
                          attributesList.map((attr, idx) => (
                            <View
                              key={attr.id || idx}
                              style={styles.attributeCard}
                            >
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
                          ))
                        ) : (
                          <Text style={styles.noAttributesText}>
                            Nuk ka atribute specifike për këtë shërbim.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Total Footer */}
            <View style={styles.actionButtons}>
              <Text style={styles.innerSectionTitle}>ÇMIMI TOTAL</Text>
              <Text style={styles.priceText}>{totalAmount.toFixed(2)} €</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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
    </View>
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
  backButtonPressed: {
    transform: [{ scale: 0.92 }],
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

  /* Body overlaps the header (.termini-container margin-top) */
  body: {
    marginHorizontal: 12,
    marginTop: -34,
  },

  /* Appointment card (.form-section-card) */
  cardGroupOuter: {
    marginBottom: 16,
  },
  currentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: RADIUS.card,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  currentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.7,
  },
  datePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.greenLight,
  },
  datePillText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  breakText: {
    flexShrink: 1,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  noteBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
  },
  noteText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  /* Services */
  skillsContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skillsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  skillsTitle: {
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
  countBadgeText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: "800",
  },
  servicesList: {
    gap: 10,
  },
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
    backgroundColor: COLORS.creamDark,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: COLORS.light,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
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
  metaText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  attributesToggleText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "700",
  },
  attributePriceContainer: {
    alignItems: "flex-end",
  },
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

  /* Attributes */
  attributesSection: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },
  attributesSectionTitle: {
    marginBottom: 8,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
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
  attributeName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  attributeDuration: {
    color: COLORS.muted,
    fontSize: 11,
  },
  attributePrice: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
  },
  attributeDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  noAttributesText: {
    color: COLORS.muted,
    fontSize: 12,
    fontStyle: "italic",
  },

  /* Total (.confirm-total) */
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.greenLight,
  },
  innerSectionTitle: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  priceText: {
    color: COLORS.green,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.9,
  },

  /* Empty state (.empty-state) */
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