import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../src/constants/theme';
import {
  checkSerialExists,
  getAllSuppliers,
  insertBar,
  insertSupplier,
} from '../src/services/database';
import type { OcrResult, Supplier } from '../src/types';

const NEW_SUPPLIER = '__new__';

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ ocrResult?: string; imageUri?: string }>();

  const [serialNumber, setSerialNumber] = useState('');
  const [weightG, setWeightG] = useState('');
  const [brand, setBrand] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (params.ocrResult) {
      try {
        const parsed: OcrResult = JSON.parse(params.ocrResult);
        setSerialNumber(parsed.serial_number ?? '');
        setWeightG(parsed.weight_g ? String(parsed.weight_g) : '');
        setBrand(parsed.brand ?? '');
      } catch {
        // ignore parse error, leave fields empty
      }
    }
  }, [params.ocrResult]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllSuppliers();
        setSuppliers(data);
      } catch {
        Alert.alert('Hata', 'Tedarikçiler yüklenirken bir hata oluştu.');
      }
    })();
  }, []);

  const handleSelectSupplier = (name: string) => {
    if (name === NEW_SUPPLIER) {
      setShowNewSupplierInput(true);
      setSelectedSupplier('');
      return;
    }
    setShowNewSupplierInput(false);
    setSelectedSupplier(name);
  };

  const handleSave = async () => {
    const trimmedSerial = serialNumber.trim();
    const trimmedBrand = brand.trim();
    const weightValue = Number(weightG);

    if (!trimmedSerial) {
      Alert.alert('Eksik Bilgi', 'Seri numarası boş olamaz.');
      return;
    }
    if (!weightValue || weightValue <= 0) {
      Alert.alert('Eksik Bilgi', 'Geçerli bir ağırlık girin.');
      return;
    }

    let receivedFrom = selectedSupplier;
    if (showNewSupplierInput) {
      receivedFrom = newSupplierName.trim();
      if (!receivedFrom) {
        Alert.alert('Eksik Bilgi', 'Kişi adı boş olamaz.');
        return;
      }
    }
    if (!receivedFrom) {
      Alert.alert('Eksik Bilgi', '"Kimden Geldi" alanını seçin.');
      return;
    }

    setSaving(true);
    try {
      const exists = await checkSerialExists(trimmedSerial);
      if (exists) {
        Alert.alert('Zaten Kayıtlı', `Bu seri numarası zaten kayıtlı! (${trimmedSerial})`);
        return;
      }

      if (showNewSupplierInput) {
        await insertSupplier(receivedFrom);
      }

      await insertBar({
        serial_number: trimmedSerial,
        weight_g: weightValue,
        brand: trimmedBrand || null,
        received_from: receivedFrom,
        notes: null,
        image_url: null,
      });

      setShowToast(true);
      setTimeout(() => {
        router.back();
      }, 800);
    } catch {
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Seri Numarası</Text>
        <TextInput
          style={styles.input}
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder="Seri numarasını girin"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Ağırlık (gram)</Text>
        <TextInput
          style={styles.input}
          value={weightG}
          onChangeText={setWeightG}
          placeholder="Örn: 50"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Marka</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Üretici / marka adı"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Kimden Geldi</Text>
        <View style={styles.chipWrap}>
          {suppliers.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, selectedSupplier === s.name && styles.chipActive]}
              onPress={() => handleSelectSupplier(s.name)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSupplier === s.name && styles.chipTextActive,
                ]}
              >
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, showNewSupplierInput && styles.chipActive]}
            onPress={() => handleSelectSupplier(NEW_SUPPLIER)}
          >
            <Text style={[styles.chipText, showNewSupplierInput && styles.chipTextActive]}>
              + Yeni Kişi Ekle
            </Text>
          </TouchableOpacity>
        </View>

        {showNewSupplierInput && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={newSupplierName}
            onChangeText={setNewSupplierName}
            placeholder="Yeni kişi adı"
            placeholderTextColor={colors.textSecondary}
          />
        )}
      </ScrollView>

      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Kaydedildi ✓</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake} disabled={saving}>
          <Text style={styles.retakeButtonText}>Yeniden Çek</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.gold,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
