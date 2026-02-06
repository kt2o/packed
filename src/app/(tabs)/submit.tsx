// import { Text, View } from "react-native";

// export default function SubmitScreen() {
//   return (
//     <View>
//     </View>
//   );
// }
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';

import { RadioButton } from 'react-native-paper';

export default function SubmitScreen() {
  
  const [selectedOption, setSelectedOption] = useState('option1');

  const handleSubmit = () => {
 
    const busyLevel = selectedOption === 'option1' ? 'Empty' : 
                      selectedOption === 'option2' ? 'Normal' : 'Packed';

    console.log('Form submitted:', {
      busyLevel: busyLevel,
      selectedValue: selectedOption
    });

    Alert.alert('Success', `You reported the location as: ${busyLevel}`);

  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollView}>
      <Text style={styles.title}>*Location*</Text>

         <View style={styles.inputContainer}>
          <Text style={styles.label}>How busy is *location*?</Text>
          <RadioButton.Group onValueChange={value => setSelectedOption(value)} value={selectedOption}>
            <View style={styles.radioOption}>
              <RadioButton value="option1" />
              <Text style={styles.radioLabel}>Empty</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="option2" />
              <Text style={styles.radioLabel}>Normal</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="option3" />
              <Text style={styles.radioLabel}>Packed</Text>
            </View>
          </RadioButton.Group>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: { 
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
   radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});