import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthModal({
  visible,
  theme,
  t,
  onClose,
  allStickers = [],
  onRegisterSuccess,
  onLoginSuccess,
}) {
  const [tab, setTab] = useState('register'); // 'register' | 'login'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grantedStickers, setGrantedStickers] = useState(null);

  const resetForm = () => {
    setPhone('');
    setEmail('');
    setPassword('');
    setGrantedStickers(null);
  };

  const handleRegister = () => {
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanPhone || cleanPhone.length < 8) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại hợp lệ để nhận thông báo SMS!');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ Gmail hợp lệ để nhận thông báo lịch trình!');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      Alert.alert('Mật khẩu quá ngắn', 'Vui lòng nhập mật khẩu tối thiểu 4 ký tự!');
      return;
    }

    // Chọn 3 sticker ngẫu nhiên từ danh sách
    const pool = allStickers.length >= 3 ? [...allStickers] : ['🌸', '🍓', '🐱', '☕', '🎂', '🧸'];
    // Xáo trộn mảng ngẫu nhiên
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const selected3Stickers = pool.slice(0, 3);

    const newUser = {
      phone: cleanPhone,
      email: cleanEmail,
      password: cleanPass,
      ownedStickers: selected3Stickers,
      registeredAt: Date.now(),
      proExpiresAt: 0,
      proTrialUsed: false,
    };

    setGrantedStickers(selected3Stickers);
    onRegisterSuccess(newUser);
  };

  const handleLogin = () => {
    const cleanPhone = phone.trim();
    const cleanPass = password.trim();

    if (!cleanPhone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại đăng nhập!');
      return;
    }
    if (!cleanPass) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu!');
      return;
    }

    onLoginSuccess({ phone: cleanPhone, password: cleanPass });
    resetForm();
    onClose();
  };

  const handleFinishReward = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                {grantedStickers ? '🎁 Quà Tặng Đăng Ký' : tab === 'register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {grantedStickers
                  ? 'Bạn nhận được 3 sticker xinh xắn đầu tiên!'
                  : 'Liên kết SĐT & Gmail để nhận thông báo lịch trình'}
              </Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          {/* Màn hình hiển thị quà tặng 3 sticker sau khi đăng ký */}
          {grantedStickers ? (
            <View style={styles.rewardContainer}>
              <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 10 }}>🎉</Text>
              <Text style={[styles.rewardTitle, { color: theme.ink }]}>ĐĂNG KÝ THÀNH CÔNG!</Text>
              <Text style={[styles.rewardDesc, { color: theme.muted }]}>
                Số điện thoại <Text style={{ fontWeight: '700', color: theme.ink }}>{phone}</Text> và Gmail <Text style={{ fontWeight: '700', color: theme.ink }}>{email}</Text> đã được kết nối để nhận thông báo lịch trình.
              </Text>

              <Text style={[styles.giftLabel, { color: theme.primary }]}>
                ✨ 3 Sticker ngẫu nhiên tặng bạn:
              </Text>
              <View style={styles.stickerRow}>
                {grantedStickers.map((stk, idx) => (
                  <View key={`stk-gift-${idx}`} style={[styles.stickerBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={{ fontSize: 32 }}>{stk}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 24 }]}
                onPress={handleFinishReward}
              >
                <Text style={styles.primaryBtnText}>Bắt đầu sử dụng 🌸</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Tab Selector: Đăng ký / Đăng nhập */}
              <View style={[styles.tabSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable
                  style={[styles.tabButton, tab === 'register' && { backgroundColor: theme.primary }]}
                  onPress={() => setTab('register')}
                >
                  <Text style={[styles.tabButtonText, { color: tab === 'register' ? '#fff' : theme.muted }]}>
                    Đăng Ký Mới
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, tab === 'login' && { backgroundColor: theme.primary }]}
                  onPress={() => setTab('login')}
                >
                  <Text style={[styles.tabButtonText, { color: tab === 'login' ? '#fff' : theme.muted }]}>
                    Đăng Nhập
                  </Text>
                </Pressable>
              </View>

              {/* Form Input: Số điện thoại */}
              <Text style={[styles.inputLabel, { color: theme.ink }]}>Số điện thoại (Nhận SMS lịch trình)</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="call-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.inputField, { color: theme.ink }]}
                  placeholder="Ví dụ: 0912345678"
                  placeholderTextColor="#B6B1BB"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              {/* Form Input: Gmail (chỉ hiển thị khi đăng ký) */}
              {tab === 'register' && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Gmail (Nhận thông báo khi đến giờ)</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="mail-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Ví dụ: banban@gmail.com"
                      placeholderTextColor="#B6B1BB"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </>
              )}

              {/* Form Input: Mật khẩu */}
              <Text style={[styles.inputLabel, { color: theme.ink }]}>Mật khẩu</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.inputField, { color: theme.ink }]}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor="#B6B1BB"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Gợi ý quà tặng */}
              {tab === 'register' && (
                <View style={[styles.tipBanner, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="sparkles" size={16} color={theme.primary} />
                  <Text style={[styles.tipText, { color: theme.primary }]}>
                    Tặng ngay 3 sticker Kawaii ngẫu nhiên khi đăng ký thành công!
                  </Text>
                </View>
              )}

              {/* Nút Thực hiện */}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={tab === 'register' ? handleRegister : handleLogin}
              >
                <Text style={styles.primaryBtnText}>
                  {tab === 'register' ? 'Đăng Ký & Nhận 3 Sticker 🎁' : 'Đăng Nhập Ngay'}
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,22,34,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '90%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D6D0DA', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabButtonText: { fontSize: 13, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  inputField: { flex: 1, fontSize: 14 },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipText: { fontSize: 12, fontWeight: '600', flex: 1 },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  rewardContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  rewardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginBottom: 8 },
  rewardDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10, marginBottom: 16 },
  giftLabel: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  stickerRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  stickerBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
