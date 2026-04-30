import React from "react";
import { Modal, View, Text, Button } from "react-native";

/**
 * Modal used to ask the user for location sharing permission.
 *
 * This component is shown when the app requires location access to verify
 * study spot check-ins.
 */
export function LocationPermissionModal({ visible, onAllow, onDeny }) {
  return (
    <Modal visible={visible}>
      <Text>Share your location with other users?</Text>
      <Button title="Allow" onPress={onAllow} />
      <Button title="Deny" onPress={onDeny} />
    </Modal>
  )
}
