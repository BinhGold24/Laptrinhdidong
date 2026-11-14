import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEPAY_CONFIG } from '../constants/data';
import {
  generateOrderDescription,
  getVietQrUrl,
  getBackupVietQrUrl,
  checkSepayTransaction,
} from '../services/sepayService';

export default function SepayPaymentModal({
  visible,
  theme,
  t,
  onClose,
  initialPackage = '3months', // '1month' | '3months' | '6months'
  userPhone = '',
  onPaymentSuccess,
}) {
  const [selectedPackage, setSelectedPackage] = useState(initialPackage);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [useBackupApi, setUseBackupApi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedPackage(initialPackage || '3months');
      setQrLoaded(false);
      setUseBackupApi(false);
    }
  }, [visible, initialPackage]);

  const pkgInfo = SEPAY_CONFIG.PACKAGES[selectedPackage] || SEPAY_CONFIG.PACKAGES['3months'];
  const orderDescription = useMemo(
    () => generateOrderDescription(userPhone, selectedPackage),
    [userPhone, selectedPackage]
  );

  const sepayQrUrl = useMemo(
    () => getVietQrUrl({ amount: pkgInfo.price, description: orderDescription }),
    [pkgInfo.price, orderDescription]
  );

  const vietQrBackupUrl = useMemo(
    () => getBackupVietQrUrl({ amount: pkgInfo.price, description: orderDescription }),
    [pkgInfo.price, orderDescription]
  );

  const activeQrUri = useBackupApi ? vietQrBackupUrl : sepayQrUrl;

  const copyToClipboard = async (text, label) => {
    let copied = false;
    try {
      const Clipboard = require('expo-clipboard');
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(String(text));
        copied = true;
      }
    } catch (e) {}

    Alert.alert(
      '📋 Đã sao chép ' + label,
      String(text) + (copied ? '\n\nĐã lưu vào bộ nhớ tạm để dán vào app ngân hàng.' : '')
    );
  };

  const handleConfirmPaid = async () => {
    setIsVerifying(true);
    const result = await checkSepayTransaction({
      orderDescription,
      amount: pkgInfo.price,
    });
    setIsVerifying(false);

    if (result.success) {
      Alert.alert(
        '🎉 Nâng cấp PRO VIP thành công!',
        `Cảm ơn bạn đã nâng cấp ${pkgInfo.name} (${pkgInfo.days} ngày).\n\nĐặc quyền PRO VIP đã được kích hoạt: Tắt quảng cáo, mở full sticker, lịch lặp và AI không giới hạn!`,
        [
          {
            text: 'Bắt đầu trải nghiệm 👑',
            onPress: () => {
              if (onPaymentSuccess) {
                onPaymentSuccess(selectedPackage);
              }
              onClose();
            },
          },
        ]
      );
    } else {
      Alert.alert('Chưa nhận được giao dịch', result.message || 'Vui lòng kiểm tra lại chuyển khoản.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background || '#FFF9F7' }]}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={[styles.modalTitle, { color: theme.ink || '#2D2833', flexShrink: 1 }]}>
                  Thanh Toán VietQR SePay
                </Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO VIP</Text>
                </View>
              </View>
              <Text style={[styles.modalSubtitle, { color: theme.muted || '#7D7685' }]}>
                Quét mã chuyển khoản tức thì — Kích hoạt tự động
              </Text>
            </View>
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.surface || '#FFF' }]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={theme.ink || '#2D2833'} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Bộ chọn gói 1 tháng, 3 tháng hoặc 6 tháng */}
            <View style={styles.packageSwitcher}>
              {Object.values(SEPAY_CONFIG.PACKAGES).map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <Pressable
                    key={pkg.id}
                    style={[
                      styles.packagePill,
                      {
                        backgroundColor: isSelected ? '#FFEAA7' : theme.surface || '#FFF',
                        borderColor: isSelected ? '#E17055' : theme.border || '#EADFD7',
                      },
                    ]}
                    onPress={() => {
                      if (selectedPackage !== pkg.id) {
                        setSelectedPackage(pkg.id);
                        setQrLoaded(false);
                        setUseBackupApi(false);
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <Text style={[styles.packagePillTitle, { color: isSelected ? '#D35400' : theme.ink || '#2D2833', textAlign: 'center' }]}>
                        {pkg.name.replace('Gói PRO ', '')}
                      </Text>
                      {pkg.tag ? (
                        <View style={[styles.tagBadge, { backgroundColor: isSelected ? '#E17055' : '#FF7E95' }]}>
                          <Text style={styles.tagBadgeText}>{pkg.tag}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.packagePillPrice, { color: isSelected ? '#D35400' : theme.primary || '#FF7E95' }]}>
                      {pkg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Khung chứa ảnh mã QR VietQR từ API */}
            <View style={[styles.qrContainer, { backgroundColor: '#FFF', borderColor: '#EADFD7' }]}>
              <View style={styles.qrHeaderTag}>
                <Ionicons name="qr-code-outline" size={16} color="#0984E3" />
                <Text style={styles.qrHeaderTagText}>Mã VietQR Chuyển Khoản Tự Động</Text>
              </View>

              <View style={styles.qrImageWrapper}>
                {!qrLoaded && (
                  <View style={styles.qrLoadingBox}>
                    <ActivityIndicator size="large" color="#FF7E95" />
                    <Text style={styles.qrLoadingText}>Đang tải mã VietQR MBBank...</Text>
                  </View>
                )}

                <Image
                  key={activeQrUri}
                  source={{ uri: activeQrUri }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onLoad={() => setQrLoaded(true)}
                  onError={() => {
                    if (!useBackupApi) {
                      setUseBackupApi(true);
                    } else {
                      setQrLoaded(true);
                    }
                  }}
                />
              </View>

              <Text style={styles.qrHint}>
                ⚡ Mở app ngân hàng quét mã để tự động điền đúng Số tiền & Nội dung
              </Text>
            </View>

            {/* Bảng thông tin chi tiết để sao chép bằng tay nếu không quét mã được */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface || '#FFF', borderColor: theme.border || '#EADFD7' }]}>
              <Text style={[styles.infoCardTitle, { color: theme.ink || '#2D2833' }]}>
                Hoặc chuyển khoản thủ công:
              </Text>

              {/* Ngân hàng */}
              <View style={styles.infoRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.infoLabel}>Ngân hàng</Text>
                  <Text style={[styles.infoValue, { color: theme.ink || '#2D2833' }]}>
                    {SEPAY_CONFIG.BANK_NAME} (Ngân hàng Quân Đội)
                  </Text>
                </View>
              </View>

              {/* Số tài khoản */}
              <View style={styles.infoRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.infoLabel}>Số tài khoản nhận</Text>
                  <Text style={[styles.infoValueHighlight, { color: '#0984E3' }]}>
                    {SEPAY_CONFIG.ACCOUNT_NUMBER}
                  </Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(SEPAY_CONFIG.ACCOUNT_NUMBER, 'Số tài khoản')}
                >
                  <Ionicons name="copy-outline" size={14} color="#0984E3" />
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </Pressable>
              </View>

              {/* Chủ tài khoản */}
              <View style={styles.infoRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.infoLabel}>Chủ tài khoản</Text>
                  <Text style={[styles.infoValue, { color: theme.ink || '#2D2833' }]}>
                    {SEPAY_CONFIG.ACCOUNT_HOLDER}
                  </Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(SEPAY_CONFIG.ACCOUNT_HOLDER, 'Chủ tài khoản')}
                >
                  <Ionicons name="copy-outline" size={14} color="#0984E3" />
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </Pressable>
              </View>

              {/* Số tiền */}
              <View style={styles.infoRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.infoLabel}>Số tiền cần chuyển</Text>
                  <Text style={[styles.infoValueHighlight, { color: '#D35400' }]}>
                    {pkgInfo.label}
                  </Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(pkgInfo.price, 'Số tiền')}
                >
                  <Ionicons name="copy-outline" size={14} color="#0984E3" />
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </Pressable>
              </View>

              {/* Nội dung chuyển khoản */}
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.infoLabel}>Nội dung chuyển khoản (bắt buộc đúng)</Text>
                  <Text style={[styles.infoValueHighlight, { color: '#E84393' }]}>
                    {orderDescription}
                  </Text>
                </View>
                <Pressable
                  style={[styles.copyBtn, { backgroundColor: '#FD79A822', borderColor: '#E84393' }]}
                  onPress={() => copyToClipboard(orderDescription, 'Nội dung chuyển khoản')}
                >
                  <Ionicons name="copy-outline" size={14} color="#E84393" />
                  <Text style={[styles.copyBtnText, { color: '#E84393' }]}>Sao chép</Text>
                </Pressable>
              </View>
            </View>

            {/* Nút bấm hành động */}
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: '#FF7E95' }]}
              onPress={handleConfirmPaid}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Tôi đã chuyển khoản xong — Kích hoạt ngay</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: theme.muted || '#7D7685' }]}>Để sau</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,22,34,0.5)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D6D0DA', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: 17.5, fontWeight: '800' },
  modalSubtitle: { fontSize: 11.5, marginTop: 3 },
  proBadge: { backgroundColor: '#FFD700', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { fontSize: 10, fontWeight: '900', color: '#6A4300' },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  packageSwitcher: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  packagePill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packagePillTitle: { fontSize: 12, fontWeight: '800' },
  packagePillPrice: { fontSize: 13.5, fontWeight: '900', marginTop: 4 },
  tagBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  tagBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  qrContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrHeaderTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  qrHeaderTagText: { fontSize: 12, fontWeight: '800', color: '#0984E3' },
  qrImageWrapper: {
    width: 240,
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingBox: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', zIndex: 2 },
  qrLoadingText: { fontSize: 11, color: '#888', marginTop: 8 },
  qrImage: { width: 228, height: 228 },
  switchQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#EBF5FB',
  },
  switchQrBtnText: { fontSize: 11, fontWeight: '700', color: '#0984E3' },
  qrHint: { fontSize: 11.5, color: '#555', textAlign: 'center', marginTop: 8, lineHeight: 16, paddingHorizontal: 8 },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  infoCardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EADFD7',
  },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  infoValue: { fontSize: 13.5, fontWeight: '700' },
  infoValueHighlight: { fontSize: 14.5, fontWeight: '900' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    backgroundColor: '#EBF5FB',
    borderColor: '#AED6F1',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyBtnText: { fontSize: 11, fontWeight: '700', color: '#0984E3' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#FF7E95',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 19,
  },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600' },
});
