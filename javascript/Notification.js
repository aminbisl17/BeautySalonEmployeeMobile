import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function getPushToken() {
  if (!Device.isDevice) {
    throw new Error('Use a physical device.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let status = existingStatus;

  if (status !== 'granted') {
    const permission = await Notifications.requestPermissionsAsync();
    status = permission.status;
  }

  if (status !== 'granted') {
    throw new Error('Notification permission denied.');
  }

const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId;

if (!projectId) {
  throw new Error("EAS project ID not found in Expo configuration");
}

  const result = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log('EXPO PUSH TOKEN:', result.data);

  return result.data;
}
