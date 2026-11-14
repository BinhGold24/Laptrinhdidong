import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Hook xử lý chiều cao bàn phím cho các Modal:
 * Khắc phục triệt để lỗi của KeyboardAvoidingView trên React Native 0.81 + Android Edge-to-Edge
 * (khiến modal bị giật nhảy lên 65px và lộ thanh TabBar phía dưới khi chạm vào ô nhập liệu).
 */
export function useModalKeyboardPadding(visible = true) {
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardPadding(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e) => {
      const h = e?.endCoordinates?.height || 0;
      if (h > 80) {
        setKeyboardPadding(h);
      }
    };

    const onHide = () => {
      setKeyboardPadding(0);
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible]);

  return keyboardPadding;
}
