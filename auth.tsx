import React, { Component, useEffect, useState } from 'react'
import { View, SafeAreaView, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import styles from './styles/general_styles'

const supabase = createClient('https://laqxbdncmapnhorlbbkg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcXhiZG5jbWFwbmhvcmxiYmtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjg2MTcyNSwiZXhwIjoyMDQyNDM3NzI1fQ.Xr3j4FThRX5C0Zk5txIqobebk6v5FBf2K5Mahe8vdzY');
const [user, setUser] = useState(null);

const [email, setEmail] = useState('');


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

class Auth extends Component {
  render() {
    const { user } = this.props; // Receive the user prop

    return (
      <SafeAreaView>
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
      </SafeAreaView>
    )
  }
}

export default Auth