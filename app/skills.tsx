import { COLORS, RADIUS, SERIF } from "@/constants/theme";
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
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Skills() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<any[]>([]);

  // Section visibility toggles
  const [showEmployeeSkills, setShowEmployeeSkills] = useState(true);
  const [showAllServices, setShowAllServices] = useState(false);

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
        imagePath: skill.service?.imagePath ?? null,
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
    // If the skill is already added, route directly to removal
    if (employeeSkills.some((s) => s.ID === service.ID)) {
      handleRemoveSkill(service.ID, service.emri_sherbimit);
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
            setSubmitting(true);
            try {
              await deleteSkill(serviceId);
              await loadSkills(); // Refetches active skills
              // If available services depend on an API fetch, trigger it here:
              // await loadServices();
            } catch (error) {
              console.log("Error removing skill:", error);
              Alert.alert("Gabim", "Dështoi largimi i aftësisë.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>
          Po ngarkohet portofoli i shërbimeve...
        </Text>
      </View>
    );
  }

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
      {/* HEADER — styled to match the Profile screen */}
      <View style={[styles.headerZone, { paddingTop: insets.top + 28 }]}>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Portofoli Profesional</Text>
        </View>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Ionicons name="cut-outline" size={34} color={COLORS.goldLight} />
          </View>
        </View>
        <Text style={styles.title}>Menuja e Shërbimeve</Text>
        <Text style={styles.subtitle}>
          Menaxhoni specializimet & trajtimet tuaja
        </Text>
        {submitting && (
          <ActivityIndicator
            size="small"
            color={COLORS.goldLight}
            style={styles.headerLoader}
          />
        )}
      </View>

      <View style={styles.body}>
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
      <View style={styles.sectionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.dropdownHeader,
            showEmployeeSkills && styles.dropdownHeaderExpanded,
            pressed && styles.pressedState,
          ]}
          onPress={() => setShowEmployeeSkills(!showEmployeeSkills)}
        >
          <View style={styles.dropdownTitleContainer}>
            <View style={styles.dropdownIconWrapper}>
              <Ionicons name="cut-outline" size={18} color={COLORS.green} />
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
            color={COLORS.muted}
          />
        </Pressable>

        {showEmployeeSkills && (
          <View style={styles.dropdownContentAttached}>
            {employeeSkills.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="sparkles-outline" size={32} color={COLORS.light} />
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
      </View>

      {/* SECTION 2: SALON CATALOG (AVAILABLE SERVICES) */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.dropdownHeader,
            showAllServices && styles.dropdownHeaderExpanded,
            pressed && styles.pressedState,
          ]}
          onPress={() => setShowAllServices(!showAllServices)}
        >
          <View style={styles.dropdownTitleContainer}>
            <View style={styles.dropdownIconWrapper}>
              <Ionicons name="grid-outline" size={18} color={COLORS.green} />
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
            color={COLORS.muted}
          />
        </Pressable>

        {showAllServices && (
          <View style={styles.dropdownContentAttached}>
            {services
              .filter(
                (service) =>
                  !employeeSkills.some(
                    (s) => (s.ID || s.id) === (service.ID || service.id),
                  ),
              )
              .map((service, index) => (
                <AvailableBeautyServiceCard
                  key={service.ID ? `service-${service.ID}-${index}` : index}
                  service={service}
                  isAdded={false}
                  submitting={submitting}
                  onPress={() => loadServiceAttributes(service)}
                  onAdd={() => handleAddSkill(service)}
                />
              ))}
          </View>
        )}
      </View>
      </View>

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
                <Ionicons name="close" size={18} color={COLORS.muted} />
              </Pressable>
            </View>

            {loadingAttributes ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={COLORS.green} />
                <Text style={styles.modalLoadingText}>
                  Po ngarkohen variacionet e trajtimit...
                </Text>
              </View>
            ) : attributes.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons
                  name="information-circle-outline"
                  size={36}
                  color={COLORS.light}
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
    </ScrollView>
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
            <Image source={{ uri: skill.imagePath }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="sparkles-outline" size={22} color={COLORS.light} />
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
              <Ionicons name="cash-outline" size={13} color={COLORS.green} />
              <Text style={styles.priceTagText}>€{skill.qmimi_baze}</Text>
            </View>
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color={COLORS.muted} />
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
          <Ionicons name="trash-outline" size={16} color={COLORS.red} />
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
              source={{ uri: service.imagePath }}
              style={styles.image}
              contentFit="cover"
              onError={(e) =>
                console.log(
                  "IMG ERROR:",
                  service.imagePath,
                  e.nativeEvent.error,
                )
              }
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="briefcase-outline" size={22} color={COLORS.light} />
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
              <Ionicons name="cash-outline" size={13} color={COLORS.green} />
              <Text style={styles.priceTagText}>€{service.qmimi_baze}</Text>
            </View>
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color={COLORS.muted} />
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
          size={15}
          color={isAdded ? COLORS.green : COLORS.surface}
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
          <Ionicons name="time-outline" size={13} color={COLORS.muted} />
          <Text style={styles.attrDetailText}>{attr.kohezgjatja} min</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={13} color={COLORS.green} />
          <Text style={styles.attrPrice}>€{attr.qmimi}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "500",
  },
  pressedState: {
    opacity: 0.75,
  },
  /* Full-width dark header matching the Profile screen */
  headerZone: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 22,
    paddingBottom: 66,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(182, 150, 99, 0.22)",
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
    letterSpacing: 2.3,
    textTransform: "uppercase",
  },
  avatarRing: {
    padding: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    borderRadius: 43,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: SERIF,
    fontSize: 29,
    fontWeight: "500",
    color: COLORS.cream,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 7,
    color: COLORS.goldSoft,
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 15,
    letterSpacing: -0.2,
    textAlign: "center",
    lineHeight: 21,
  },
  headerLoader: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  body: {
    marginHorizontal: 12,
    marginTop: -32,
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingVertical: 17,
    paddingHorizontal: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    width: "100%",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.green,
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },

  emptyCard: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    width: "100%",
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.creamDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  /* CONNECTED SECTION & UNIFIED PANEL DROPDOWN STYLES */
  sectionContainer: {
    marginTop: 8,
    marginBottom: 6,
    width: "100%",
    alignItems: "stretch",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    width: "100%",
  },
  dropdownHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownContentAttached: {
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 2,
    width: "100%",
    alignItems: "stretch",
  },
  dropdownTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdownIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.control,
    backgroundColor: COLORS.greenLight,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "left",
  },
  dropdownSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
    textAlign: "left",
  },

  /* UNIFIED LIST CARDS */
  skillCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    width: "100%",
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    width: "100%",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 6,
  },
  activeBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.green,
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
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.green,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.creamDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  actionColumn: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.control,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerBg,
  },

  imageContainer: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.control,
    overflow: "hidden",
    backgroundColor: COLORS.creamDark,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    alignItems: "flex-start",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
    textAlign: "left",
  },
  description: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
    textAlign: "left",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addedBtn: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
  },
  addBtnText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: "600",
  },
  addedBtnText: {
    color: COLORS.green,
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
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 10,
    maxHeight: "82%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalPill: {
    width: 38,
    height: 4,
    backgroundColor: COLORS.border,
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
    borderBottomColor: COLORS.creamDark,
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: SERIF,
    fontSize: 21,
    fontWeight: "500",
    color: COLORS.text,
    textAlign: "left",
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "left",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.creamDark,
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
    color: COLORS.muted,
  },
  modalEmpty: {
    padding: 32,
    alignItems: "center",
  },
  modalEmptyText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.light,
    textAlign: "center",
  },
  attrCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
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
    color: COLORS.text,
    textAlign: "left",
  },
  attrDesc: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    marginBottom: 8,
    textAlign: "left",
  },
  attrFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  attrDetailText: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 4,
  },
  attrPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.green,
    marginLeft: 4,
  },
  discountBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.green,
  },
});
