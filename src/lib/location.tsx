import * as Location from 'expo-location'

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync()
  return status === 'granted'
}

export async function getCurrentLocation() {
  return await Location.getCurrentPositionAsync({})
}
