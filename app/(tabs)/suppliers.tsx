import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { colors } from '../../src/constants/theme';
import {
  deleteSupplier,
  getAllSuppliers,
  insertSupplier,
  supplierHasBars,
} from '../../src/services/database';
import { supabase } from '../../src/services/supabase';
import type { Supplier } from '../../src/types';

export default function SuppliersScreen() {
  const navigation = useNavigation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Oturumu kapatmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch {
      Alert.alert('Hata', 'Tedarikçiler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSuppliers();
    }, [fetchSuppliers])
  );

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      await insertSupplier(trimmed);
      setNewName('');
      await fetchSuppliers();
    } catch {
      Alert.alert('Hata', 'Tedarikçi eklenirken bir hata oluştu.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (supplier: Supplier) => {
    Alert.alert('Tedarikçiyi Sil', `"${supplier.name}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            const hasBars = await supplierHasBars(supplier.name);
            if (hasBars) {
              Alert.alert('Silinemez', 'Bu kişiye ait kayıtlar var, silinemez.');
              return;
            }
            await deleteSupplier(supplier.id);
            await fetchSuppliers();
          } catch {
            Alert.alert('Hata', 'Tedarikçi silinirken bir hata oluştu.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Yeni tedarikçi adı"
          placeholderTextColor={colors.textSecondary}
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity
          style={[styles.addButton, (!newName.trim() || adding) && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={!newName.trim() || adding}
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.addButtonText}>Ekle</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={suppliers.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz tedarikçi yok. Ekle butonuna bas.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  addRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  rowText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});
