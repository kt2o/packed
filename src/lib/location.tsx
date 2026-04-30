/**
 * Location helper utilities for the study spot flow.
 */
import * as Location from 'expo-location'

/**
 * Ask the user for foreground location permission.
 *
 * Returns true when permission is granted.
 */
export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync()
  return status === 'granted'
}

/**
 * Return the device's current GPS location.
 */
export async function getCurrentLocation() {
  return await Location.getCurrentPositionAsync({})
}
