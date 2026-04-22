import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const saveToken = async (token) => {

  if (Platform.OS === "web") {
    localStorage.setItem("token", token);
  } else {
    await SecureStore.setItemAsync("token", token);
  }

};

export const getToken = async () => {

  if (Platform.OS === "web") {
    return localStorage.getItem("token");
  } else {
    return await SecureStore.getItemAsync("token");
  }

};

export const removeToken = async () => {

  if (Platform.OS === "web") {
    localStorage.removeItem("token");
  } else {
    await SecureStore.deleteItemAsync("token");
  }

};

export const saveRole = async (role) => {

  if (Platform.OS === "web") {
    localStorage.setItem("role", role);
  } else {
    await SecureStore.setItemAsync("role", role);
  }

};

export const getRole = async () => {

  if (Platform.OS === "web") {
    return localStorage.getItem("role");
  } else {
    return await SecureStore.getItemAsync("role");
  }

};

export const removeRole = async () => {

  if (Platform.OS === "web") {
    localStorage.removeItem("role");
  } else {
    await SecureStore.deleteItemAsync("role");
  }

};

export const clearAuth = async () => {

  await removeToken();
  await removeRole();

};