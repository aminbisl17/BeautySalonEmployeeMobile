import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.card}
        onPress={() => router.push("/AvailableDates")}
      >
        <View>
          <Text style={styles.title}>Availability</Text>
          <Text style={styles.subtitle}>Set your working schedule</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable style={styles.card}>
        <View>
          <Text style={styles.title}>Terminet</Text>
          <Text style={styles.subtitle}>Set your working schedule</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    marginBottom: 16, // <-- Gap between panels
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  subtitle: {
    color: "#666",
    marginTop: 4,
  },

  arrow: {
    fontSize: 28,
    color: "#999",
  },
});
