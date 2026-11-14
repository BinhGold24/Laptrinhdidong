import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModalKeyboardPadding } from '../utils/keyboardUtils';
import {
  validateVietnamPhone,
  validateEmailSync,
  verifyEmailDomainOnline,
} from '../utils/validationUtils';

export default function AuthModal({
  visible,
  theme,
  t,
  onClose,
  allStickers = [],
  isLoggedIn = false,
  onRegisterSuccess,
  onLoginSuccess,
  onResetPassword,
}) {
  const [tab, setTab] = useState(isLoggedIn ? 'login' : 'register'); // 'register' | 'login' | 'forgot'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [grantedStickers, setGrantedStickers] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const keyboardPadding = useModalKeyboardPadding(visible);

  const phoneCheck = phone.trim().length > 0 ? validateVietnamPhone(phone) : null;
  const emailCheck = email.trim().length > 0 ? validateEmailSync(email) : null;

  useEffect(() => {
    if (visible) {
      setTab(isLoggedIn ? 'login' : 'register');
      setShowPassword(false);
      setVerifying(false);
    }
  }, [visible, isLoggedIn]);

  const resetForm = () => {
    setPhone('');
    setEmail('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setGrantedStickers(null);
    setVerifying(false);
  };

  const handleRegister = async () => {
    if (verifying) return;
    const cleanPass = password.trim();

    const phoneRes = validateVietnamPhone(phone);
    if (!phoneRes.valid) {
      Alert.alert('Số điện thoại không hợp lệ', phoneRes.message);
      return;
    }

    setVerifying(true);
    const emailRes = await verifyEmailDomainOnline(email);
    setVerifying(false);

    if (!emailRes.valid) {
      if (emailRes.suggestion) {
        Alert.alert(
          'Sai tên miền Email',
          emailRes.message,
          [
            { text: 'Để tôi tự sửa', style: 'cancel' },
            {
              text: `Đổi thành ${emailRes.suggestion}`,
              onPress: () => setEmail(emailRes.suggestion),
            },
          ]
        );
      } else {
        Alert.alert('Email không hợp lệ / không tồn tại', emailRes.message);
      }
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      Alert.alert('Mật khẩu quá ngắn', 'Vui lòng nhập mật khẩu tối thiểu 4 ký tự!');
      return;
    }

    const finalPhone = phoneRes.normalizedPhone;
    const finalEmail = emailRes.normalizedEmail;
    setPhone(finalPhone);
    setEmail(finalEmail);

    // Chọn 3 sticker ngẫu nhiên từ danh sách
    const pool = allStickers.length >= 3 ? [...allStickers] : ['🌸', '🍓', '🐱', '☕', '🎂', '🧸'];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const selected3Stickers = pool.slice(0, 3);

    const newUser = {
      phone: finalPhone,
      email: finalEmail,
      carrier: phoneRes.carrier,
      password: cleanPass,
      ownedStickers: selected3Stickers,
      registeredAt: Date.now(),
      proExpiresAt: 0,
      proTrialUsed: false,
    };

    const ok = await onRegisterSuccess(newUser);
    if (ok) {
      setGrantedStickers(selected3Stickers);
    }
  };

  const handleLogin = async () => {
    if (verifying) return;
    const cleanPass = password.trim();

    const phoneRes = validateVietnamPhone(phone);
    if (!phoneRes.valid) {
      Alert.alert('Số điện thoại không hợp lệ', phoneRes.message);
      return;
    }
    if (!cleanPass) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu!');
      return;
    }

    const finalPhone = phoneRes.normalizedPhone;
    setPhone(finalPhone);

    const ok = await onLoginSuccess({ phone: finalPhone, password: cleanPass });
    if (ok) {
      resetForm();
      onClose();
    }
  };

  const handleForgotPassword = async () => {
    if (verifying) return;
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    const phoneRes = validateVietnamPhone(phone);
    if (!phoneRes.valid) {
      Alert.alert('Số điện thoại không hợp lệ', phoneRes.message);
      return;
    }

    setVerifying(true);
    const emailRes = await verifyEmailDomainOnline(email);
    setVerifying(false);

    if (!emailRes.valid) {
      if (emailRes.suggestion) {
        Alert.alert(
          'Sai tên miền Email',
          emailRes.message,
          [
            { text: 'Để tôi tự sửa', style: 'cancel' },
            {
              text: `Đổi thành ${emailRes.suggestion}`,
              onPress: () => setEmail(emailRes.suggestion),
            },
          ]
        );
      } else {
        Alert.alert('Email không hợp lệ', emailRes.message);
      }
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới phải có tối thiểu 4 ký tự!');
      return;
    }
    if (cleanPass !== cleanConfirm) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại!');
      return;
    }

    const finalPhone = phoneRes.normalizedPhone;
    const finalEmail = emailRes.normalizedEmail;
    setPhone(finalPhone);
    setEmail(finalEmail);

    if (onResetPassword) {
      const ok = await onResetPassword({
        phone: finalPhone,
        email: finalEmail,
        newPassword: cleanPass,
      });
      if (ok) {
        setPassword(cleanPass);
        setNewPassword('');
        setConfirmPassword('');
        setTab('login');
      }
    }
  };

  const renderPhoneHint = () => {
    if (!phoneCheck) return null;
    return (
      <View style={styles.validationRow}>
        <Ionicons
          name={phoneCheck.valid ? 'checkmark-circle' : 'alert-circle'}
          size={13}
          color={phoneCheck.valid ? '#10B981' : '#EF4444'}
        />
        <Text
          style={[
            styles.validationText,
            { color: phoneCheck.valid ? '#10B981' : '#EF4444' },
          ]}
        >
          {phoneCheck.message}
        </Text>
      </View>
    );
  };

  const renderEmailHint = () => {
    if (!emailCheck) return null;
    return (
      <View style={styles.validationWrap}>
        <View style={styles.validationRow}>
          <Ionicons
            name={emailCheck.valid ? 'checkmark-circle' : 'alert-circle'}
            size={13}
            color={emailCheck.valid ? '#10B981' : '#EF4444'}
          />
          <Text
            style={[
              styles.validationText,
              { color: emailCheck.valid ? '#10B981' : '#EF4444' },
            ]}
          >
            {emailCheck.message}
          </Text>
        </View>
        {emailCheck.suggestion && (
          <Pressable
            style={[styles.suggestionChip, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
            onPress={() => setEmail(emailCheck.suggestion)}
          >
            <Ionicons name="sparkles" size={12} color={theme.primary} />
            <Text style={[styles.suggestionText, { color: theme.primary }]}>
              Chạm để sửa nhanh: {emailCheck.suggestion}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const handleFinishReward = () => {
    resetForm();
    onClose();
  };

  const getHeaderTitle = () => {
    if (grantedStickers) return '🎁 Quà Tặng Đăng Ký';
    if (tab === 'register') return 'Đăng Ký Tài Khoản';
    if (tab === 'forgot') return 'Quên Mật Khẩu';
    return 'Đăng Nhập';
  };

  const getHeaderSubtitle = () => {
    if (grantedStickers) return 'Bạn nhận được 3 sticker xinh xắn đầu tiên!';
    if (tab === 'register') return 'Liên kết SĐT & Email để đồng bộ lịch và bảo mật tài khoản';
    if (tab === 'forgot') return 'Xác thực SĐT & Gmail đã đăng ký để đặt mật khẩu mới';
    return 'Đăng nhập để đồng bộ lịch cá nhân & thông báo';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, keyboardPadding > 0 && { paddingBottom: keyboardPadding }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                {getHeaderTitle()}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {getHeaderSubtitle()}
              </Text>
            </View>
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          {/* Màn hình hiển thị quà tặng 3 sticker sau khi đăng ký */}
          {grantedStickers ? (
            <View style={styles.rewardContainer}>
              <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 10 }}>🎉</Text>
              <Text style={[styles.rewardTitle, { color: theme.ink }]}>ĐĂNG KÝ THÀNH CÔNG!</Text>
              <Text style={[styles.rewardDesc, { color: theme.muted }]}>
                Số điện thoại <Text style={{ fontWeight: '700', color: theme.ink }}>{phone}</Text> và Email{' '}
                <Text style={{ fontWeight: '700', color: theme.ink }}>{email}</Text> đã được lưu để đồng bộ lịch và bảo mật tài khoản.
              </Text>

              <Text style={[styles.giftLabel, { color: theme.primary }]}>
                ✨ 3 Sticker ngẫu nhiên tặng bạn:
              </Text>
              <View style={styles.stickerRow}>
                {grantedStickers.map((stk, idx) => (
                  <View
                    key={`stk-gift-${idx}`}
                    style={[styles.stickerBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
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
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Tab Selector: Đăng Ký Mới / Đăng Nhập / Quên MK */}
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
                <Pressable
                  style={[styles.tabButton, tab === 'forgot' && { backgroundColor: theme.primary }]}
                  onPress={() => setTab('forgot')}
                >
                  <Text style={[styles.tabButtonText, { color: tab === 'forgot' ? '#fff' : theme.muted }]}>
                    Quên MK
                  </Text>
                </Pressable>
              </View>

              {/* Form Tab: QUÊN MẬT KHẨU */}
              {tab === 'forgot' ? (
                <>
                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Số điện thoại đã đăng ký</Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: phoneCheck ? (phoneCheck.valid ? '#10B981' : '#EF4444') : theme.border,
                      },
                    ]}
                  >
                    <Ionicons name="call-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Ví dụ: 0912345678"
                      placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                  {renderPhoneHint()}

                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Gmail xác thực tài khoản</Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: emailCheck ? (emailCheck.valid ? '#10B981' : '#EF4444') : theme.border,
                      },
                    ]}
                  >
                    <Ionicons name="mail-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Nhập Gmail đã liên kết với SĐT..."
                      placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                  {renderEmailHint()}

                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Mật khẩu mới</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)..."
                      placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.muted} />
                    </Pressable>
                  </View>

                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Xác nhận mật khẩu mới</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Nhập lại mật khẩu mới..."
                      placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 8, opacity: verifying ? 0.75 : 1 }]}
                    onPress={handleForgotPassword}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <View style={styles.btnLoadingRow}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.primaryBtnText}>Đang xác thực Email & SĐT...</Text>
                      </View>
                    ) : (
                      <Text style={styles.primaryBtnText}>Xác Nhận Đổi Mật Khẩu 🔒</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  {/* Form Input: Số điện thoại */}
                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Số điện thoại (Nhận SMS lịch trình)</Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: phoneCheck ? (phoneCheck.valid ? '#10B981' : '#EF4444') : theme.border,
                      },
                    ]}
                  >
                    <Ionicons name="call-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Ví dụ: 0912345678"
                      placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                  {renderPhoneHint()}

                  {/* Form Input: Gmail (chỉ hiển thị khi đăng ký) */}
                  {tab === 'register' && (
                    <>
                      <Text style={[styles.inputLabel, { color: theme.ink }]}>Email / Gmail (Xác thực & khôi phục mật khẩu)</Text>
                      <View
                        style={[
                          styles.inputBox,
                          {
                            backgroundColor: theme.surface,
                            borderColor: emailCheck ? (emailCheck.valid ? '#10B981' : '#EF4444') : theme.border,
                          },
                        ]}
                      >
                        <Ionicons name="mail-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                        <TextInput
                          style={[styles.inputField, { color: theme.ink }]}
                          placeholder="Ví dụ: banban@gmail.com"
                          placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>
                      {renderEmailHint()}
                    </>
                  )}

                  {/* Form Input: Mật khẩu */}
                  <Text style={[styles.inputLabel, { color: theme.ink }]}>Mật khẩu</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.ink }]}
                      placeholder="Nhập mật khẩu..."
                      placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.muted} />
                    </Pressable>
                  </View>

                  {/* Hàng nút phụ trợ: Quên mật khẩu & Chuyển đổi nhanh */}
                  <View style={styles.forgotRow}>
                    <Pressable onPress={() => setTab('forgot')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[styles.forgotText, { color: theme.secondary || theme.primary }]}>
                        🔑 Quên mật khẩu? Đặt lại ngay
                      </Text>
                    </Pressable>
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
                    style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: verifying ? 0.75 : 1 }]}
                    onPress={tab === 'register' ? handleRegister : handleLogin}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <View style={styles.btnLoadingRow}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.primaryBtnText}>Đang xác thực Email & SĐT...</Text>
                      </View>
                    ) : (
                      <Text style={styles.primaryBtnText}>
                        {tab === 'register' ? 'Đăng Ký & Nhận 3 Sticker 🎁' : 'Đăng Nhập Ngay'}
                      </Text>
                    )}
                  </Pressable>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
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
    maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D6D0DA', alignSelf: 'center', marginBottom: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
    gap: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: { fontSize: 11.5, fontWeight: '700', textAlign: 'center' },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 6,
  },
  inputField: { flex: 1, fontSize: 13.5 },
  validationWrap: {
    marginBottom: 8,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  validationText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    marginBottom: 14,
  },
  tipText: { fontSize: 11.5, fontWeight: '600', flex: 1 },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
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
