import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CUTE_STICKERS } from '../constants/data';
import { dateLabel } from '../utils/dateUtils';

export default function StickerModal({
  visible,
  theme,
  lang,
  t,
  selectedDateStr,
  selectedDateSticker,
  stickers = CUTE_STICKERS,
  isProUser = false,
  accountRole = 'guest', // 'guest' | 'member' | 'pro'
  ownedStickers = [],
  onClose,
  onSelectSticker,
  onRemoveSticker,
  onOpenProModal,
  onOpenAuthModal,
}) {
  const stickerList = stickers && stickers.length > 0 ? stickers : CUTE_STICKERS;
  const effectiveOwned = accountRole === 'guest' ? ['🌸'] : ownedStickers;

  const handlePressSticker = (stk) => {
    const isUnlocked = isProUser || effectiveOwned.includes(stk);
    if (!isUnlocked) {
      if (accountRole === 'guest') {
        Alert.alert(
          'Tài khoản Thường',
          'Bạn đang sử dụng Tài khoản Thường (chưa đăng ký). Hãy đăng ký bằng số điện thoại để nhận ngay 3 sticker ngẫu nhiên, hoặc nâng cấp PRO để mở khóa tất cả!',
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Đăng Ký Nhận 3 Sticker 🎁',
              onPress: () => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal();
              },
            },
            {
              text: 'Xem Gói PRO 👑',
              onPress: () => {
                onClose();
                if (onOpenProModal) onOpenProModal();
              },
            },
          ]
        );
        return;
      }

      if (onOpenProModal) {
        onClose();
        onOpenProModal();
      }
      return;
    }
    onSelectSticker(stk);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={[styles.modalTitle, { color: theme.ink, flexShrink: 1 }]}>{t.modalStickerTitle}</Text>
                {accountRole === 'pro' && (
                  <View style={[styles.proBadge, { backgroundColor: '#FFD700' }]}>
                    <Text style={styles.proBadgeText}>👑 PRO VIP FULL</Text>
                  </View>
                )}
                {accountRole === 'member' && (
                  <View style={[styles.proBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.proBadgeText, { color: theme.primary }]}>Thành viên</Text>
                  </View>
                )}
                {accountRole === 'guest' && (
                  <View style={[styles.proBadge, { backgroundColor: theme.line }]}>
                    <Text style={[styles.proBadgeText, { color: theme.muted }]}>Tài khoản Thường</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {accountRole === 'pro'
                  ? 'Bản Thành viên PRO: Bạn có thể chọn sticker thoải mái!'
                  : accountRole === 'member'
                  ? `Tài khoản Thành viên: Đang có ${ownedStickers.length} sticker sở hữu. Hoàn thành 20 tầng Kim Tự Tháp để mở full!`
                  : 'Tài khoản Thường (Chưa ĐK): Có 1 sticker mặc định. Đăng ký để nhận 3 sticker ngẫu nhiên!'}
              </Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>


          <ScrollView contentContainerStyle={styles.stickerGrid}>
            {stickerList.map((stk, idx) => {
              const isUnlocked = isProUser || effectiveOwned.includes(stk);

              return (
                <Pressable
                  key={`stk-${idx}`}
                  style={[
                    styles.stickerCell,
                    {
                      backgroundColor: isUnlocked ? theme.surface : theme.line,
                      borderColor: isUnlocked ? theme.border : '#DDD',
                      opacity: isUnlocked ? 1 : 0.6,
                    },
                  ]}
                  onPress={() => handlePressSticker(stk)}
                >
                  <Text style={{ fontSize: 28 }}>{stk}</Text>
                  {!isUnlocked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={11} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedDateSticker ? (
            <Pressable
              style={[styles.removeStickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={onRemoveSticker}
            >
              <Ionicons name="trash-outline" size={16} color="#D46B78" />
              <Text style={{ color: '#D46B78', fontSize: 13, fontWeight: '700' }}>{t.removeSticker}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,22,34,0.35)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D6D0DA', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 11, marginTop: 3 },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 10 },
  stickerCell: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeStickerBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proBadgeText: { fontSize: 10, fontWeight: '900', color: '#6A4300' },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#888',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
