import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';

// Initialize Supabase client
const supabase = createClient('https://laqxbdncmapnhorlbbkg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcXhiZG5jbWFwbmhvcmxiYmtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjg2MTcyNSwiZXhwIjoyMDQyNDM3NzI1fQ.Xr3j4FThRX5C0Zk5txIqobebk6v5FBf2K5Mahe8vdzY');

export default function DateTimePickerWithSupabase() {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [compliment, setCompliment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  
  // Auth states
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit data.');
      return;
    }

    setLoading(true);

    try {
      if (!date || !time || !compliment) {
        throw new Error('Please fill all fields');
      }

      const dateTime = new Date(date);
      dateTime.setHours(time.getHours(), time.getMinutes());

      const data = {
        date_time: dateTime.toISOString(),
        elogios: JSON.stringify({ text: compliment }),
      };

      if (imageUri) {
        let response = await fetch(imageUri);
        let blob = await response.blob();

        const { error: storageError, data: storageData } = await supabase.storage
          .from('images')
          .upload(
            `compliment-${Date.now()}.jpg`,
            blob,
            {
              contentType: 'image/jpeg',
            }
          );

        if (storageError) throw storageError;

        data.image_url = storageData.path;
      }

      const { error } = await supabase.from('users').insert(data);

      if (error) throw error;

      Alert.alert('Success', 'Data submitted successfully!');
      setDate(new Date());
      setTime(new Date());
      setCompliment('');
      setImageUri(null);
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Error submitting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    console.log('Sending magic link to:', email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('Error:', error.message);
      Alert.alert('Error', error.message);
    } else {
      console.log('Magic link sent successfully!');
      Alert.alert('Success', 'Check your email for the magic link!');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
            />
          </View>

          <TouchableOpacity onPress={sendMagicLink} style={styles.button}>
            <Text style={styles.buttonText}>Send Magic Link</Text>
          </TouchableOpacity>

          {user && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                  <Text>{format(date, 'PPP')}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
                  <Text>{format(time, 'p')}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Compliment</Text>
                <TextInput
                  style={styles.input}
                  value={compliment}
                  onChangeText={setCompliment}
                  placeholder="Enter your compliment here"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Image</Text>
                <TouchableOpacity onPress={pickImage} style={styles.input}>
                  <Text>{imageUri ? 'Image Selected' : 'Select Image'}</Text>
                </TouchableOpacity>
                {imageUri && <Text style={styles.imageSelected}>Image selected: {imageUri}</Text>}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              >
                <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  imageSelected: {
    marginTop: 8,
    color: '#059669',
  },
});
