import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, ChevronDown } from 'lucide-react-native';

export default function GAInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  leftIcon,
  subLabel,
  isPhone = false,
  phoneCode = '+234',
  onSelectPhoneCode,
  style,
  inputStyle,
}) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {isPhone ? (
        <View style={styles.phoneRow}>
          <TouchableOpacity
            style={styles.countryCodeBox}
            activeOpacity={0.8}
            onPress={onSelectPhoneCode}
          >
            <Text style={styles.countryCodeText}>{phoneCode}</Text>
            <ChevronDown size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <View
            style={[
              styles.inputContainer,
              { flex: 1 },
              error ? styles.errorContainer : null,
            ]}
          >
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              style={[styles.textInput, inputStyle]}
            />
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.inputContainer,
            error ? styles.errorContainer : null,
          ]}
        >
          {leftIcon && <View style={styles.iconBox}>{leftIcon}</View>}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#64748B"
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            style={[styles.textInput, inputStyle]}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              style={styles.eyeBox}
              activeOpacity={0.7}
            >
              {isSecure ? (
                <Eye size={20} color="#94A3B8" />
              ) : (
                <EyeOff size={20} color="#00E5FF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  countryCodeBox: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  focusedContainer: {
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  errorContainer: {
    borderColor: '#EF4444',
  },
  iconBox: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    height: '100%',
  },
  eyeBox: {
    padding: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500',
  },
});
