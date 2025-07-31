import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

const {width} = Dimensions.get('window');

const Toast = ({message, type = 'info', visible, onHide}) => {
  const {theme} = useTheme();
  const [animation] = useState(new Animated.Value(-50));

  useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(animation, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onHide) onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, animation, onHide]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: getBackgroundColor(),
      borderRadius: 8,
      padding: 15,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      transform: [{translateY: animation}],
      zIndex: 1000,
    },
    text: {
      color: '#FFFFFF',
      fontSize: 16,
      textAlign: 'center',
    },
  });

  if (!visible) return null;

  return (
    <Animated.View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default Toast;