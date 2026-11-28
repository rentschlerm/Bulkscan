// Keep the focused text field visible above the keyboard.
// Android apps are edge-to-edge now, so the OS no longer resizes the screen for the
// keyboard. The root KeyboardAvoidingView (App.js) makes room, and KScroll scrolls
// whichever field you tapped into the visible area.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';

const RevealCtx = createContext(null);
const GAP = 28; // space between the field and the keyboard

export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return visible;
}

export const KScroll = React.forwardRef(function KScroll(props, outerRef) {
  const { horizontal, onScroll, contentContainerStyle, children, ...rest } = props;
  const ref = useRef(null);
  const offset = useRef(0);
  const kbTop = useRef(null);

  const setRefs = (r) => {
    ref.current = r;
    if (typeof outerRef === 'function') outerRef(r);
    else if (outerRef) outerRef.current = r;
  };

  const reveal = useCallback(() => {
    // Wait for the layout to settle (keyboard animation / KeyboardAvoidingView padding).
    setTimeout(() => {
      const input = TextInput.State?.currentlyFocusedInput?.();
      const sv = ref.current;
      if (!input || !sv || kbTop.current == null) return;
      sv.measureInWindow?.((sx, sy, sw, sh) => {
        input.measureInWindow?.((x, y, w, h) => {
          const visibleBottom = Math.min(kbTop.current, sy + sh);
          const overlapBottom = y + h + GAP - visibleBottom;
          const overlapTop = sy + 8 - y;
          if (overlapBottom > 0) sv.scrollTo({ y: offset.current + overlapBottom, animated: true });
          else if (overlapTop > 0) sv.scrollTo({ y: Math.max(0, offset.current - overlapTop), animated: true });
        });
      });
    }, 120);
  }, []);

  useEffect(() => {
    if (horizontal) return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      kbTop.current = e.endCoordinates.screenY;
      reveal();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      kbTop.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [horizontal, reveal]);

  if (horizontal) {
    return (
      <ScrollView ref={setRefs} horizontal onScroll={onScroll} contentContainerStyle={contentContainerStyle} {...rest}>
        {children}
      </ScrollView>
    );
  }

  return (
    <RevealCtx.Provider value={reveal}>
      <ScrollView
        ref={setRefs}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        scrollEventThrottle={16}
        {...rest}
        contentContainerStyle={contentContainerStyle}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
      >
        {children}
        <View style={{ height: 48 }} />
      </ScrollView>
    </RevealCtx.Provider>
  );
});

/** Drop-in TextInput that scrolls itself into view when focused. */
export const Input = React.forwardRef(function Input({ onFocus, ...props }, ref) {
  const reveal = useContext(RevealCtx);
  return (
    <TextInput
      ref={ref}
      {...props}
      onFocus={(e) => {
        reveal?.();
        onFocus?.(e);
      }}
    />
  );
});

/** Wrap the content of a Modal (modals are separate windows). */
export function KeyboardSafe({ children, style }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function RootKeyboardAvoider({ children }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  );
}
