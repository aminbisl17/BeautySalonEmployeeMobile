import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function getSkills() {
  const API_SKILLS_GET_ID = Constants.expoConfig?.extra?.API_SKILLS_GET_ID;

  if (!API_SKILLS_GET_ID) {
    throw new Error("missing API_SKILLS_GET_ID");
  }

  const token = await SecureStore.getItemAsync("accessToken");
  const userID = await SecureStore.getItemAsync("userDetails");

  try {
    const response = await axios.get(
      API_SKILLS_GET_ID + JSON.parse(userID).ID,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function addSkills(skills) {
  const API_SKILLS_ADD = Constants.expoConfig?.extra?.API_SKILLS_ADD;

  if (!API_SKILLS_ADD) {
    throw new Error("missing API_SKILLS_ADD");
  }

  const token = await SecureStore.getItemAsync("accessToken");
  const userID = await SecureStore.getItemAsync("userDetails");
  try {
    const response = await axios.post(
      API_SKILLS_ADD,
      {
        id_employee: JSON.parse(userID).ID,
        id_services: skills.id_services,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function deleteSkill(id) {
  const API_SKILLS_DELETE = Constants.expoConfig?.extra?.API_SKILLS_DELETE;
  const token = await SecureStore.getItemAsync("accessToken");
  console.log(API_SKILLS_DELETE + id);
  if (!API_SKILLS_DELETE) {
    throw new Error("Missing API_SKILLS_UPDATE");
  }
  try {
    const res = await axios.delete(API_SKILLS_DELETE + id, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";
    Alert.alert("Error", errorMessage);
  }
}
