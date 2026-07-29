import { getSkills } from "@/javascript/employees/skillsAPI";
import {
  fetchServiceAtributes,
  fetchServices,
} from "@/javascript/sherbimet/sherbimetAPI";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Skills() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      if (res && res.services) {
        setEmployeeSkills(res.services);
      }
    } catch (e) {
      console.log("Error loading skills:", e);
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

  const handleAddSkill = (service: any) => {
    Alert.alert(
      "Shto Aftësi",
      `A dëshironi të shtoni "${service.emri_sherbimit}" te aftësitë tuaja?`,
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Shto",
          onPress: () => {
            if (employeeSkills.some((s) => s.ID === service.ID)) {
              Alert.alert("Njoftim", "Kjo aftësi është e shtuar tashmë.");
              return;
            }
            setEmployeeSkills((prev) => [...prev, service]);
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
          onPress: () => {
            setEmployeeSkills((prev) => prev.filter((s) => s.ID !== serviceId));
          },
        },
      ],
    );
  };

  const handleModifySkill = (service: any) => {
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/Home")}
          >
            <Ionicons name="arrow-back" size={22} color="#4F46E5" />
          </Pressable>
          <Text style={styles.title}>Aftësitë e Punonjësit</Text>
        </View>

        {/* SECTION 1: CURRENT EMPLOYEE SKILLS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Aftësitë Aktuale ({employeeSkills.length})
          </Text>
        </View>

        {employeeSkills.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>
              Nuk keni asnjë aftësi të regjistruar.
            </Text>
          </View>
        ) : (
          employeeSkills.map((skill) => (
            <View key={skill.ID} style={styles.skillCard}>
              <Pressable
                style={styles.info}
                onPress={() =>
                  loadServiceAttributes(skill.ID, skill.emri_sherbimit)
                }
              >
                <Text style={styles.name}>{skill.emri_sherbimit}</Text>
                {skill.pershkrimi ? (
                  <Text style={styles.description}>{skill.pershkrimi}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={14} color="#4F46E5" />
                    <Text style={styles.detailText}>€{skill.qmimi_baze}</Text>
                  </View>
                  <View style={[styles.detailRow, { marginLeft: 12 }]}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {skill.kohezgjatja} min
                    </Text>
                  </View>
                </View>
              </Pressable>

              <View style={styles.actionColumn}>
                <Pressable
                  style={[styles.iconBtn, styles.editBtn]}
                  onPress={() => handleModifySkill(skill)}
                >
                  <Ionicons name="pencil" size={16} color="#4F46E5" />
                </Pressable>
                <Pressable
                  style={[styles.iconBtn, styles.deleteBtn]}
                  onPress={() => handleRemoveSkill(skill.ID)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* SECTION 2: DROPDOWN FOR ALL SERVICES */}
        <Pressable
          style={styles.dropdownHeader}
          onPress={() => setShowAllServices(!showAllServices)}
        >
          <View style={styles.dropdownTitleContainer}>
            <Ionicons name="list-outline" size={20} color="#4F46E5" />
            <Text style={styles.dropdownTitle}>Shërbimet e Disponueshme</Text>
          </View>
          <Ionicons
            name={showAllServices ? "chevron-up" : "chevron-down"}
            size={20}
            color="#64748B"
          />
        </Pressable>

        {showAllServices && (
          <View style={styles.dropdownContent}>
            {services.map((service) => {
              const isAdded = employeeSkills.some((s) => s.ID === service.ID);
              return (
                <View key={service.ID} style={styles.card}>
                  <Pressable
                    style={styles.cardContent}
                    onPress={() =>
                      loadServiceAttributes(service.ID, service.emri_sherbimit)
                    }
                  >
                    {service.imagePath && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{
                            uri: `data:image/jpeg;base64,${service.imagePath}`,
                          }}
                          style={styles.image}
                        />
                      </View>
                    )}

                    <View style={styles.info}>
                      <Text style={styles.name}>{service.emri_sherbimit}</Text>
                      {service.pershkrimi ? (
                        <Text style={styles.description} numberOfLines={2}>
                          {service.pershkrimi}
                        </Text>
                      ) : null}

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color="#4F46E5"
                        />
                        <Text style={styles.detailText}>
                          €{service.qmimi_baze}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[styles.addBtn, isAdded && styles.disabledAddBtn]}
                    disabled={isAdded}
                    onPress={() => handleAddSkill(service)}
                  >
                    <Ionicons
                      name={isAdded ? "checkmark-circle" : "add-circle-outline"}
                      size={22}
                      color={isAdded ? "#10B981" : "#4F46E5"}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ATTRIBUTES MODAL DIALOG */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Atributet e Shërbimit</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedServiceName}
                </Text>
              </View>
              <Pressable
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
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
                  size={32}
                  color="#94A3B8"
                />
                <Text style={styles.modalEmptyText}>
                  Kjo shërbim nuk ka atribute të caktuara.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                {attributes.map((attr) => (
                  <View key={attr.id_atributit} style={styles.attrCard}>
                    <View style={styles.attrHeader}>
                      <Text style={styles.attrOption}>{attr.opsioni}</Text>
                      {attr.zbritja > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            -{attr.zbritja}%
                          </Text>
                        </View>
                      )}
                    </View>

                    {attr.pershkrimi ? (
                      <Text style={styles.attrDesc}>{attr.pershkrimi}</Text>
                    ) : null}

                    <View style={styles.attrFooter}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color="#64748B"
                        />
                        <Text style={styles.attrDetailText}>
                          {attr.kohezgjatja} min
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="cash-outline"
                          size={13}
                          color="#4F46E5"
                        />
                        <Text style={styles.attrPrice}>€{attr.qmimi}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  emptyCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 14,
  },
  skillCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  actionColumn: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
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
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  dropdownContent: {
    marginTop: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
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
    marginBottom: 4,
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
    padding: 6,
  },
  disabledAddBtn: {
    opacity: 0.6,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  modalLoading: {
    padding: 24,
    alignItems: "center",
  },
  modalLoadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  modalEmpty: {
    padding: 24,
    alignItems: "center",
  },
  modalEmptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  attrCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
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
    fontWeight: "600",
    color: "#0F172A",
  },
  attrDesc: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  attrFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  attrDetailText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  attrPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
    marginLeft: 4,
  },
  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
});
