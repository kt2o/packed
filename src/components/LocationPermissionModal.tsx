import { Modal, View, Text, Button } from "react-native";
export function LocationPermissionModal({ visible, onAllow, onDeny }) {
  return (
    <Modal visible={visible}>
      <Text>Share your location with other users?</Text>
      <Button title="Allow" onPress={onAllow} />
      <Button title="Deny" onPress={onDeny} />
    </Modal>
  )
}
