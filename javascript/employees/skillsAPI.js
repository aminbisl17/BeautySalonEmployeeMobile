import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { api } from "../client";

async function getEmployeeId() {
  const userDetails = await SecureStore.getItemAsync("userDetails");
  const id = userDetails ? JSON.parse(userDetails)?.ID : null;
  if (!id) throw new Error("User details not found. Please log in again.");
  return id;
}

export async function getSkills() {
  const url = Constants.expoConfig?.extra?.API_SKILLS_GET_ID;
  if (!url) throw new Error("Missing API_SKILLS_GET_ID");

  try {
    const employeeId = await getEmployeeId();
    const response = await api.get(url + employeeId);
    const data = response.data;
    return (Array.isArray(data) ? data : []).map((item) => {
    const { imagepath, ...restService } = item.service || {};
      return {
        ...item,
        service: {
          ...restService,
          imagePath: restService.imagePath ?? imagepath,
        },
      };
    });
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Something went wrong.";

    Alert.alert("Error", String(errorMessage));
    throw new Error(String(errorMessage));
  }
}

export async function addSkills(skills) {
  const url = Constants.expoConfig?.extra?.API_SKILLS_ADD;
  if (!url) throw new Error("Missing API_SKILLS_ADD");

  try {
    const employeeId = await getEmployeeId();
    const response = await api.post(url, {
      id_employee: employeeId,
      id_services: skills.id_services,
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Something went wrong.";

    Alert.alert("Error", String(errorMessage));
    throw new Error(String(errorMessage));
  }
}

export async function deleteSkill(id) {
  const url = Constants.expoConfig?.extra?.API_SKILLS_DELETE;
  if (!url) throw new Error("Missing API_SKILLS_DELETE");

  try {
    const response = await api.delete(url + id);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Something went wrong.";

    Alert.alert("Error", String(errorMessage));
    throw new Error(String(errorMessage));
  }
}