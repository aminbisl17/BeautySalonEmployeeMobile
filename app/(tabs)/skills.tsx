import { fetchServices } from "@/javascript/sherbimet/sherbimetAPI";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
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

  const loadServices = async () => {
    try {
      const res = await fetchServices();
      setServices(res);
    } catch (e) {
      console.log("Error loading services:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Po ngarkohen shërbimet...</Text>
      </View>
    );
  }

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

        <Text style={styles.title}>Kthehu</Text>
      </View>

      {services.map((service) => (
        <View key={service.ID} style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: `data:image/jpeg;base64,${service.imagePath}`,
              }}
              style={styles.image}
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{service.emri_sherbimit}</Text>

            {service.pershkrimi ? (
              <Text style={styles.description}>{service.pershkrimi}</Text>
            ) : null}

            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={15} color="#4F46E5" />
              <Text style={styles.detailText}>€{service.qmimi_baze}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={15} color="#64748B" />
              <Text style={styles.detailText}>
                {service.kohezgjatja} minuta
              </Text>
            </View>

            {service.zbritja > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discount}>Zbritje {service.zbritja}%</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
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
    marginBottom: 16,
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

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
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
    justifyContent: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },

  description: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  detailText: {
    fontSize: 13,
    color: "#334155",
    marginLeft: 6,
  },

  discountBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
  },

  discount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
});
