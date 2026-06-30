import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { colors } from '../../src/constants/theme';
import {
  deleteBar,
  deleteSale,
  getAllBars,
  getAllSales,
  getAllSuppliers,
  sellBar,
} from '../../src/services/database';
import { exportBarsToExcel } from '../../src/services/export';
import { supabase } from '../../src/services/supabase';
import type { GoldBar, Sale, Supplier } from '../../src/types';

const ALL = 'Tümü';
type Tab = 'stock' | 'sales';

export default function StockScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [bars, setBars] = useState<GoldBar[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState(ALL);
  const [weightFilter, setWeightFilter] = useState<string>(ALL);
  const [refreshing, setRefreshing] = useState(false);

  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellingBar, setSellingBar] = useState<GoldBar | null>(null);
  const [soldTo, setSoldTo] = useState('');
  const [saleNote, setSaleNote] = useState('');
  const [selling, setSelling] = useState(false);

  const fetchBars = useCallback(async () => {
    try {
      const data = await getAllBars();
      setBars(data);
    } catch {
      Alert.alert('Hata', 'Stok listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const data = await getAllSales();
      setSales(data);
    } catch {
      Alert.alert('Hata', 'Satış geçmişi yüklenirken bir hata oluştu.');
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch {
      // sessizce geç
    }
  }, []);

  useEffect(() => {
    fetchBars();
    fetchSales();
    fetchSuppliers();

    const channel = supabase
      .channel('gold_bars_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gold_bars' },
        () => fetchBars()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBars, fetchSales, fetchSuppliers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchBars(), fetchSales(), fetchSuppliers()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchBars, fetchSales, fetchSuppliers]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportBarsToExcel();
    } catch {
      Alert.alert('Hata', 'Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        exporting ? (
          <ActivityIndicator size="small" color={colors.gold} style={{ marginRight: 16 }} />
        ) : (
          <TouchableOpacity onPress={handleExport} style={{ marginRight: 16 }}>
            <Text style={styles.exportText}>Dışa Aktar</Text>
          </TouchableOpacity>
        ),
    });
  }, [navigation, handleExport, exporting]);

  const openSellModal = (bar: GoldBar) => {
    setSellingBar(bar);
    setSoldTo('');
    setSaleNote('');
    setSellModalVisible(true);
  };

  const handleSell = async () => {
    if (!sellingBar) return;
    const trimmedSoldTo = soldTo.trim();
    if (!trimmedSoldTo) {
      Alert.alert('Eksik Bilgi', '"Kime Satıldı" alanını doldurun.');
      return;
    }

    setSelling(true);
    try {
      await sellBar(sellingBar, trimmedSoldTo, saleNote.trim() || null);
      setSellModalVisible(false);
      await fetchSales();
    } catch {
      Alert.alert('Hata', 'Satış kaydedilirken bir hata oluştu.');
    } finally {
      setSelling(false);
    }
  };

  const handleDeleteSale = (sale: Sale) => {
    Alert.alert(
      'Satış Kaydını Sil',
      `Bu satış kaydını silmek istiyor musunuz?\n\nSeri No: ${sale.serial_number}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSale(sale.id);
              await fetchSales();
            } catch {
              Alert.alert('Hata', 'Satış kaydı silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteBar = (bar: GoldBar) => {
    Alert.alert(
      'Ne yapmak istiyorsunuz?',
      `Seri No: ${bar.serial_number}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sat',
          onPress: () => openSellModal(bar),
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBar(bar.id);
            } catch {
              Alert.alert('Hata', 'Kayıt silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const weightOptions = useMemo(() => {
    const weights = Array.from(new Set(bars.map((b) => b.weight_g))).sort((a, b) => a - b);
    return [ALL, ...weights.map((w) => String(w))];
  }, [bars]);

  const filteredBars = useMemo(() => {
    return bars.filter((bar) => {
      if (supplierFilter !== ALL && bar.received_from !== supplierFilter) return false;
      if (weightFilter !== ALL && String(bar.weight_g) !== weightFilter) return false;
      return true;
    });
  }, [bars, supplierFilter, weightFilter]);

  const summary = useMemo(() => {
    const totalCount = filteredBars.length;
    const totalWeight = filteredBars.reduce((sum, b) => sum + b.weight_g, 0);
    return { totalCount, totalWeight };
  }, [filteredBars]);

  const salesSummary = useMemo(() => {
    const totalCount = sales.length;
    const totalWeight = sales.reduce((sum, s) => sum + s.weight_g, 0);
    return { totalCount, totalWeight };
  }, [sales]);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
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
      {/* Tab Toggle */}
      <View style={styles.tabToggle}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stock' && styles.tabButtonActive]}
          onPress={() => setActiveTab('stock')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'stock' && styles.tabButtonTextActive]}>
            Mevcut Stok
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'sales' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'sales' && styles.tabButtonTextActive]}>
            Satılanlar ({sales.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <TouchableOpacity
        style={styles.summaryBar}
        onPress={handleRefresh}
        disabled={refreshing}
        activeOpacity={0.7}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : activeTab === 'stock' ? (
          <Text style={styles.summaryText}>
            Toplam: {summary.totalCount} adet | {summary.totalWeight} gram
          </Text>
        ) : (
          <Text style={styles.summaryText}>
            Satılan: {salesSummary.totalCount} adet | {salesSummary.totalWeight} gram
          </Text>
        )}
      </TouchableOpacity>

      {activeTab === 'stock' ? (
        <>
          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            {[ALL, ...suppliers.map((s) => s.name)].map((name) => (
              <TouchableOpacity
                key={name}
                style={[styles.chip, supplierFilter === name && styles.chipActive]}
                onPress={() => setSupplierFilter(name)}
              >
                <Text
                  style={[styles.chipText, supplierFilter === name && styles.chipTextActive]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            {weightOptions.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.chip, weightFilter === w && styles.chipActive]}
                onPress={() => setWeightFilter(w)}
              >
                <Text style={[styles.chipText, weightFilter === w && styles.chipTextActive]}>
                  {w === ALL ? ALL : `${w}g`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stock List */}
          <FlatList
            data={filteredBars}
            keyExtractor={(item) => item.id}
            contentContainerStyle={filteredBars.length === 0 && styles.emptyContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Henüz kayıt yok. Tara sekmesinden başla.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onLongPress={() => handleDeleteBar(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowHeader}>
                  <Text style={styles.brand}>{item.brand || 'Marka belirtilmemiş'}</Text>
                  <Text style={styles.weight}>{item.weight_g}g</Text>
                </View>
                <Text style={styles.serial}>Seri No: {item.serial_number}</Text>
                <View style={styles.rowFooter}>
                  <Text style={styles.from}>{item.received_from}</Text>
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        /* Sales List */
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={sales.length === 0 && styles.emptyContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz satış kaydı yok.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onLongPress={() => handleDeleteSale(item)}
              activeOpacity={0.7}
            >
              <View style={styles.rowHeader}>
                <Text style={styles.brand}>{item.brand || 'Marka belirtilmemiş'}</Text>
                <Text style={styles.weight}>{item.weight_g}g</Text>
              </View>
              <Text style={styles.serial}>Seri No: {item.serial_number}</Text>
              <View style={styles.soldToRow}>
                <Text style={styles.soldToLabel}>Satıldı →</Text>
                <Text style={styles.soldToValue}>{item.sold_to}</Text>
              </View>
              {item.sale_note ? (
                <Text style={styles.saleNote}>Not: {item.sale_note}</Text>
              ) : null}
              <View style={styles.rowFooter}>
                <Text style={styles.from}>{item.received_from}</Text>
                <Text style={styles.date}>{formatDate(item.sold_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Sell Modal */}
      <Modal
        visible={sellModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Satış Bilgisi</Text>
            {sellingBar && (
              <Text style={styles.modalSubtitle}>
                {sellingBar.brand} - {sellingBar.weight_g}g ({sellingBar.serial_number})
              </Text>
            )}

            <Text style={styles.modalLabel}>Kime Satıldı *</Text>
            <TextInput
              style={styles.modalInput}
              value={soldTo}
              onChangeText={setSoldTo}
              placeholder="Alıcı adı"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.modalLabel}>Not (opsiyonel)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={saleNote}
              onChangeText={setSaleNote}
              placeholder="Satışla ilgili not..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSellModalVisible(false)}
                disabled={selling}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSellButton, selling && styles.modalSellButtonDisabled]}
                onPress={handleSell}
                disabled={selling}
              >
                {selling ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.modalSellText}>Sat</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  exportText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },
  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.gold,
  },
  tabButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: colors.background,
  },
  summaryBar: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  summaryText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  filterRow: {
    marginTop: 12,
    flexGrow: 0,
  },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  weight: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  serial: {
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: 6,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  from: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  soldToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  soldToLabel: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  soldToValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  saleNote: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  modalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  modalSellButton: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSellButtonDisabled: {
    opacity: 0.6,
  },
  modalSellText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});
