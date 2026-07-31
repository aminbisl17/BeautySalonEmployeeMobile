import {
  addSkills,
  deleteSkill,
  getSkills,
} from "@/javascript/employees/skillsAPI";
import {
  fetchServiceAtributes,
  fetchServices,
} from "@/javascript/sherbimet/sherbimetAPI";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Skills() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<any[]>([]);

  // Section visibility toggles
  const [showEmployeeSkills, setShowEmployeeSkills] = useState(true);
  const [showAllServices, setShowAllServices] = useState(true);

  // Modal & Service detail state
  const [modalVisible, setModalVisible] = useState(false);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const loadServices = async () => {
    try {
      const res = await fetchServices();
      setServices(res || []);
    } catch (e) {
      console.log("Error loading services:", e);
    }
  };

  const loadSkills = async () => {
    try {
      const res = await getSkills();
      const rawSkills = Array.isArray(res) ? res : (res?.data ?? []);
      const formatted = rawSkills.map((skill: any) => ({
        id: skill.id,
        id_employee: skill.id_employee,
        id_service: skill.id_service,
        ID: skill.service?.ID ?? skill.id_service,
        emri_sherbimit: skill.service?.emri_sherbimit ?? "",
        pershkrimi: skill.service?.pershkrimi ?? "",
        qmimi_baze: skill.service?.qmimi_baze ?? 0,
        kohezgjatja: skill.service?.kohezgjatja ?? 0,
        imagePath: skill.service?.imagepath ?? null,
        atributet: skill.service?.atributet ?? [],
        service: skill.service,
      }));

      setEmployeeSkills(formatted);
    } catch (e) {
      console.log("Error loading skills:", e);
      setEmployeeSkills([]);
    }
  };

  const loadServiceAttributes = async (service: any) => {
    setSelectedService(service);
    setModalVisible(true);
    setLoadingAttributes(true);
    try {
      const serviceId = service.id_service || service.ID;
      const res = await fetchServiceAtributes(serviceId);
      setAttributes(res?.atributet || []);
    } catch (e) {
      console.log("Error loading attributes:", e);
      setAttributes([]);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([loadServices(), loadSkills()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadServices(), loadSkills()]);
    setRefreshing(false);
  }, []);

  const handleAddSkill = async (service: any) => {
    if (employeeSkills.some((s) => s.ID === service.ID)) {
      Alert.alert(
        "Njoftim",
        "Kjo aftësi është e shtuar tashmë te profili juaj.",
      );
      return;
    }

    Alert.alert(
      "Aktivizo Shërbimin",
      `Dëshironi ta shtoni shërbimin "${service.emri_sherbimit}" në menu-në tuaj të shërbimeve?`,
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Shto Shërbimin",
          onPress: async () => {
            setSubmitting(true);
            try {
              await addSkills({ id_services: [service.ID] });
              await loadSkills();
            } catch (error) {
              console.log("Error updating skills:", error);
              Alert.alert("Gabim", "Dështoi ruajtja e aftësive te serveri.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleRemoveSkill = (serviceId: number, serviceName: string) => {
    Alert.alert(
      "Largo Shërbimin",
      `A jeni të sigurt që dëshironi ta largoni "${serviceName}" nga menuja juaj? Klientët nuk do të mund ta rezervojnë më me ju.`,
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Largo",
          style: "destructive",
          onPress: async () => {
            await deleteSkill(serviceId);
            await loadSkills();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>
          Po ngarkohet portofoli i shërbimeve...
        </Text>
      </View>
    );
  }

  // Calculate quick metrics for the beauty artist
  const totalServices = employeeSkills.length;
  const avgDuration =
    totalServices > 0
      ? Math.round(
          employeeSkills.reduce(
            (acc, curr) => acc + (curr.kohezgjatja || 0),
            0,
          ) / totalServices,
        )
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
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
          {/* TOP HEADER */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedState,
              ]}
              onPress={() => router.push("/Home")}
            >
              <Ionicons name="arrow-back" size={20} color="#4F46E5" />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Menuja e Shërbimeve</Text>
              <Text style={styles.subtitle}>
                Menaxhoni specializimet & trajtimet tuaja
              </Text>
            </View>
            {submitting && (
              <ActivityIndicator
                size="small"
                color="#4F46E5"
                style={{ marginLeft: "auto" }}
              />
            )}
          </View>

          {/* BEAUTY ARTIST OVERVIEW SUMMARY */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalServices}</Text>
              <Text style={styles.summaryLabel}>Shërbime Aktive</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{avgDuration} min</Text>
              <Text style={styles.summaryLabel}>Kohëzgjatja Mesatare</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {services.length - totalServices}
              </Text>
              <Text style={styles.summaryLabel}>Të Disponueshme</Text>
            </View>
          </View>

          {/* SECTION 1: ACTIVE BEAUTY SERVICES (PORTFOLIO) */}
          <Pressable
            style={({ pressed }) => [
              styles.dropdownHeader,
              pressed && styles.pressedState,
            ]}
            onPress={() => setShowEmployeeSkills(!showEmployeeSkills)}
          >
            <View style={styles.dropdownTitleContainer}>
              <View style={styles.dropdownIconWrapper}>
                <Ionicons name="cut-outline" size={18} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.dropdownTitle}>
                  Portofoli Im i Shërbimeve
                </Text>
                <Text style={styles.dropdownSub}>
                  {employeeSkills.length} shërbime që ofroni aktualisht
                </Text>
              </View>
            </View>
            <Ionicons
              name={showEmployeeSkills ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748B"
            />
          </Pressable>

          {showEmployeeSkills && (
            <View style={styles.dropdownContent}>
              {employeeSkills.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="sparkles-outline"
                      size={32}
                      color="#94A3B8"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    Nuk keni shtuar asnjë shërbim
                  </Text>
                  <Text style={styles.emptyText}>
                    Zgjidhni shërbimet nga katalogu i sallonit më poshtë për t'i
                    aktivizuar në profilin tuaj profesional.
                  </Text>
                </View>
              ) : (
                employeeSkills.map((skill, index) => (
                  <BeautySkillCard
                    key={`skill-${skill.id}-${index}`}
                    skill={skill}
                    submitting={submitting}
                    onPress={() => loadServiceAttributes(skill)}
                    onRemove={() =>
                      handleRemoveSkill(skill.id, skill.emri_sherbimit)
                    }
                  />
                ))
              )}
            </View>
          )}

          {/* SECTION 2: SALON CATALOG (AVAILABLE SERVICES) */}
          <Pressable
            style={({ pressed }) => [
              styles.dropdownHeader,
              pressed && styles.pressedState,
            ]}
            onPress={() => setShowAllServices(!showAllServices)}
          >
            <View style={styles.dropdownTitleContainer}>
              <View style={styles.dropdownIconWrapper}>
                <Ionicons name="grid-outline" size={18} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.dropdownTitle}>Katalogu i Sallonit</Text>
                <Text style={styles.dropdownSub}>
                  {services.length} trajtime të gatshme për shtim
                </Text>
              </View>
            </View>
            <Ionicons
              name={showAllServices ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748B"
            />
          </Pressable>

          {showAllServices && (
            <View style={styles.dropdownContent}>
              {services.map((service, index) => {
                const isAdded = employeeSkills.some((s) => s.ID === service.ID);
                return (
                  <AvailableBeautyServiceCard
                    key={service.ID ? `service-${service.ID}-${index}` : index}
                    service={service}
                    isAdded={isAdded}
                    submitting={submitting}
                    onPress={() => loadServiceAttributes(service)}
                    onAdd={() => handleAddSkill(service)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* SERVICE ATTRIBUTES & VARIATIONS MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalPill} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle}>Variacionet & Detajet</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {selectedService?.emri_sherbimit}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && styles.pressedState,
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={18} color="#64748B" />
                </Pressable>
              </View>

              {loadingAttributes ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.modalLoadingText}>
                    Po ngarkohen variacionet e trajtimit...
                  </Text>
                </View>
              ) : attributes.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Ionicons
                    name="information-circle-outline"
                    size={36}
                    color="#94A3B8"
                  />
                  <Text style={styles.modalEmptyText}>
                    Ky shërbim ka vetëm çmimin bazë dhe nuk përmban
                    nen-variacione.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: 380 }}
                  showsVerticalScrollIndicator={false}
                >
                  {attributes.map((attr, index) => (
                    <AttributeItem
                      key={
                        attr.id_atributit
                          ? `attr-${attr.id_atributit}-${index}`
                          : index
                      }
                      attr={attr}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* Active Beauty Skill Card Component */
function BeautySkillCard({
  skill,
  submitting,
  onPress,
  onRemove,
}: {
  skill: any;
  submitting: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.skillCard}>
      <Pressable
        style={({ pressed }) => [
          styles.cardContent,
          pressed && styles.pressedState,
        ]}
        onPress={onPress}
      >
        <View style={styles.imageContainer}>
          {skill.imagePath ? (
            <Image
              source={{
                uri: `data:image/jpeg;base64,${skill.imagePath}`,
              }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="sparkles-outline" size={24} color="#94A3B8" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{skill.emri_sherbimit}</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Aktiv</Text>
            </View>
          </View>

          {skill.pershkrimi ? (
            <Text style={styles.description} numberOfLines={2}>
              {skill.pershkrimi}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.priceTag}>
              <Ionicons name="cash-outline" size={13} color="#4F46E5" />
              <Text style={styles.priceTagText}>€{skill.qmimi_baze}</Text>
            </View>
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={styles.timeTagText}>{skill.kohezgjatja} min</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionColumn}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            styles.deleteBtn,
            pressed && styles.pressedState,
          ]}
          onPress={onRemove}
          disabled={submitting}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

/* Available Salon Catalog Card Component */
function AvailableBeautyServiceCard({
  service,
  isAdded,
  submitting,
  onPress,
  onAdd,
}: {
  service: any;
  isAdded: boolean;
  submitting: boolean;
  onPress: () => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [
          styles.cardContent,
          pressed && styles.pressedState,
        ]}
        onPress={onPress}
      >
        <View style={styles.imageContainer}>
          {service.imagePath ? (
            <Image
              source={{
                uri: `data:image/jpeg;base64,${service.imagePath}`,
              }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="briefcase-outline" size={24} color="#94A3B8" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{service.emri_sherbimit}</Text>
          {service.pershkrimi ? (
            <Text style={styles.description} numberOfLines={2}>
              {service.pershkrimi}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.priceTag}>
              <Ionicons name="cash-outline" size={13} color="#4F46E5" />
              <Text style={styles.priceTagText}>€{service.qmimi_baze}</Text>
            </View>
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={styles.timeTagText}>{service.kohezgjatja} min</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.addBtn,
          isAdded && styles.addedBtn,
          (isAdded || submitting) && styles.disabledAddBtn,
          pressed && !isAdded && styles.pressedState,
        ]}
        disabled={isAdded || submitting}
        onPress={onAdd}
      >
        <Ionicons
          name={isAdded ? "checkmark" : "add"}
          size={16}
          color={isAdded ? "#10B981" : "#FFFFFF"}
        />
        <Text style={[styles.addBtnText, isAdded && styles.addedBtnText]}>
          {isAdded ? "Aktiv" : "Shto"}
        </Text>
      </Pressable>
    </View>
  );
}

/* Modal Attribute Item Component */
function AttributeItem({ attr }: { attr: any }) {
  return (
    <View style={styles.attrCard}>
      <View style={styles.attrHeader}>
        <Text style={styles.attrOption}>{attr.opsioni}</Text>
        {attr.zbritja > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{attr.zbritja}%</Text>
          </View>
        )}
      </View>

      {attr.pershkrimi ? (
        <Text style={styles.attrDesc}>{attr.pershkrimi}</Text>
      ) : null}

      <View style={styles.attrFooter}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={13} color="#64748B" />
          <Text style={styles.attrDetailText}>{attr.kohezgjatja} min</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={13} color="#4F46E5" />
          <Text style={styles.attrPrice}>€{attr.qmimi}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "500",
  },
  pressedState: {
    opacity: 0.75,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* BEAUTY ARTIST OVERVIEW BAR */
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },

  emptyCard: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  /* DROPDOWNS & CARDS */
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdownIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  dropdownSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  dropdownContent: {
    marginTop: 10,
  },

  skillCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 6,
  },
  activeBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  actionColumn: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#FEF2F2",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    width: 58,
    height: 58,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addedBtn: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  addedBtnText: {
    color: "#10B981",
  },
  disabledAddBtn: {
    opacity: 0.85,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 10,
    maxHeight: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalPill: {
    width: 38,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoading: {
    padding: 32,
    alignItems: "center",
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },
  modalEmpty: {
    padding: 32,
    alignItems: "center",
  },
  modalEmptyText: {
    marginTop: 10,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  attrCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  attrOption: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  attrDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 8,
  },
  attrFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  attrDetailText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  attrPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4F46E5",
    marginLeft: 4,
  },
  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
});
