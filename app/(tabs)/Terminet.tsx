import { getTerminet } from "@/javascript/employees/TerminetAPI";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Track expanded service detail IDs to show/hide attributes
  const [expandedDetailIds, setExpandedDetailIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadTerminet();
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
        <View style={[styles.currentCard, styles.cardActiveShadow]}>
          {/* Header Row: Client Name & Date */}
          <View style={styles.currentHeaderRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.currentDateRange}>
                {item.client.emri} {item.client.mbiemri}
              </Text>
            </View>
            <Text style={styles.detailTimeText}>
              {formatDate(item.data_caktimit)}
            </Text>
          </View>

          {/* Client Contact */}
          <Text style={styles.breakText}>📞 {item.client.numri_telefonit}</Text>
          {item.client.email ? (
            <Text style={styles.breakText}>✉️ {item.client.email}</Text>
          ) : null}
          {item.pershkrimi ? (
            <Text style={styles.serviceDescription}>
              Shënim: {item.pershkrimi}
            </Text>
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
                          <Text style={styles.metaText}>
                            ⏱ {detail.kohezgjatja} min
                          </Text>
                          {attributesList.length > 0 && (
                            <Text style={styles.attributesToggleText}>
                              {isExpanded
                                ? "▼ Fshih Atributet"
                                : "▶ Shfaq Atributet"}
                            </Text>
                          )}
                        </View>
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
              <Text style={styles.innerSectionTitle}>Çmimi Total:</Text>
              <Text style={styles.priceText}>{totalAmount.toFixed(2)} €</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/Home")}
          >
            <Ionicons name="arrow-back" size={22} color="#4F46E5" />
          </Pressable>

          <Text style={styles.title}>Kthehu</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Terminet</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMINET E CAKTUARA</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color="#4F46E5"
            size="large"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={appointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item.id_terminit.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.noSkillsText}>
                Nuk ka termine të caktuara.
              </Text>
            }
          />
        )}
      </ScrollView>
    </View>
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
  serviceDescription: {
    fontSize: 12,
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
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  skillRowContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    overflow: "hidden",
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  serviceImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
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
  placeholderText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
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
  attributesToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },
  attributePriceContainer: {
    alignItems: "flex-end",
  },
  skillPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 2,
  },
  attributeOriginalPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  attributesSection: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  attributesSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  attributeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    padding: 8,
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
    gap: 6,
  },
  attributeName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  attributeDuration: {
    fontSize: 11,
    color: "#64748B",
  },
  attributePrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  attributeDescription: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  noAttributesText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
  },
  noSkillsText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    paddingVertical: 8,
  },
});
