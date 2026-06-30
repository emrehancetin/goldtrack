import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Eksik Bilgi', 'E-posta ve şifre girin.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
      }
    } catch {
      Alert.alert('Hata', 'Giriş sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>GoldTrack</Text>
      <Text style={styles.subtitle}>Devam etmek için giriş yapın</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="E-posta"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Şifre"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});
