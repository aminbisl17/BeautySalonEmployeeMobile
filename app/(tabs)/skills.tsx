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
  const [showAllServices, setShowAllServices] = useState(false);

  // Modal & Attributes State
  const [modalVisible, setModalVisible] = useState(false);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [selectedServiceName, setSelectedServiceName] = useState("");

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

      // Safely extract array regardless of whether backend returns [...] or { data: [...] }
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
      setEmployeeSkills([]); // Fallback to empty array on error
    }
  };
  const loadServiceAttributes = async (id: number, serviceName: string) => {
    setSelectedServiceName(serviceName);
    setModalVisible(true);
    setLoadingAttributes(true);
    try {
      const res = await fetchServiceAtributes(id);
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
      Alert.alert("Njoftim", "Kjo aftësi është e shtuar tashmë.");
      return;
    }

    Alert.alert(
      "Shto Aftësi",
      `A dëshironi të shtoni "${service.emri_sherbimit}" te aftësitë tuaja?`,
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Shto",
          onPress: async () => {
            setSubmitting(true);
            try {
              // Option A: Send ONLY the newly added ID if your backend just does INSERT
              await addSkills({ id_services: [service.ID] });

              // Update UI state upon success
              setEmployeeSkills((prev) => [...prev, service]);
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
  const handleRemoveSkill = (serviceId: number) => {
    Alert.alert(
      "Fshij Aftësinë",
      "A jeni të sigurt që dëshironi ta fshini këtë aftësi?",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshij",
          style: "destructive",
          onPress: async () => {
            await deleteSkill(serviceId);
            await loadSkills();
            //  await saveSkillsToBackend(updatedSkills);
          },
        },
      ],
    );
  };

  const handleModifySkill = (service: any) => {
    //   console.log(service);
    Alert.alert(
      "Modifiko Aftësinë",
      `Modifiko detajet e aftësisë: ${service.emri_sherbimit}`,
      [
        { text: "Rregullo", onPress: () => {} },
        { text: "Anulo", style: "cancel" },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Po ngarkohen të dhënat...</Text>
      </View>
    );
  }

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
          {/* HEADER */}
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
              <Text style={styles.title}>Aftësitë e Punonjësit</Text>
              <Text style={styles.subtitle}>Menaxhoni shërbimet tuaja</Text>
            </View>
            {submitting && (
              <ActivityIndicator
                size="small"
                color="#4F46E5"
                style={{ marginLeft: "auto" }}
              />
            )}
          </View>

          {/* SECTION 1: CURRENT EMPLOYEE SKILLS */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Aftësitë Aktuale</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{employeeSkills.length}</Text>
              </View>
            </View>
          </View>

          {employeeSkills.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="sparkles-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Asnjë aftësi e shtuar</Text>
              <Text style={styles.emptyText}>
                Zgjidhni shërbime nga lista më poshtë për t'i shtuar te profili
                juaj.
              </Text>
            </View>
          ) : (
            employeeSkills.map((skill, index) => (
              <SkillCard
                key={`skill-${skill.id}-${index}`}
                skill={skill}
                submitting={submitting}
                onPress={() =>
                  loadServiceAttributes(skill.id_service, skill.emri_sherbimit)
                }
                onModify={() => handleModifySkill(skill)}
                onRemove={() => handleRemoveSkill(skill.id)}
              />
            ))
          )}

          {/* SECTION 2: ALL AVAILABLE SERVICES */}
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
                <Text style={styles.dropdownTitle}>
                  Shërbimet e Disponueshme
                </Text>
                <Text style={styles.dropdownSub}>
                  {services.length} shërbime të gatshme
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
                  <AvailableServiceCard
                    key={service.ID ? `service-${service.ID}-${index}` : index}
                    service={service}
                    isAdded={isAdded}
                    submitting={submitting}
                    onPress={() =>
                      loadServiceAttributes(service.ID, service.emri_sherbimit)
                    }
                    onAdd={() => handleAddSkill(service)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ATTRIBUTES MODAL */}
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
                  <Text style={styles.modalTitle}>Atributet e Shërbimit</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {selectedServiceName}
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
                    Po ngarkohen atributet...
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
                    Kjo shërbim nuk ka atribute të caktuara.
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
function SkillCard({
  skill,
  submitting,
  onPress,
  onModify,
  onRemove,
}: {
  skill: any;
  submitting: boolean;
  onPress: () => void;
  onModify: () => void;
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
        {/* SERVICE IMAGE / FALLBACK */}
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
              <Ionicons name="briefcase-outline" size={24} color="#94A3B8" />
            </View>
          )}
        </View>

        {/* DETAILS */}
        <View style={styles.info}>
          <Text style={styles.name}>{skill.emri_sherbimit}</Text>
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

      {/* ACTION BUTTONS */}
      <View style={styles.actionColumn}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            styles.editBtn,
            pressed && styles.pressedState,
          ]}
          onPress={onModify}
          disabled={submitting}
        >
          <Ionicons name="pencil" size={15} color="#4F46E5" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            styles.deleteBtn,
            pressed && styles.pressedState,
          ]}
          onPress={onRemove}
          disabled={submitting}
        >
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

function AvailableServiceCard({
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
          size={18}
          color={isAdded ? "#10B981" : "#FFFFFF"}
        />
        <Text style={[styles.addBtnText, isAdded && styles.addedBtnText]}>
          {isAdded ? "Shtuar" : "Shto"}
        </Text>
      </Pressable>
    </View>
  );
}

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

// ==========================================
// REFINED & COMPATIBLE STYLES
// ==========================================

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
    marginBottom: 24,
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  emptyCard: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
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
  skillCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
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
    marginLeft: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: "#EEF2FF",
  },
  deleteBtn: {
    backgroundColor: "#FEF2F2",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
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
  detailText: {
    fontSize: 12,
    color: "#334155",
    marginLeft: 4,
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

  /* Modal Styles */
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
