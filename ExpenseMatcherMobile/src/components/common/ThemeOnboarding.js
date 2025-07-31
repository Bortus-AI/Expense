import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeOnboarding = ({ children }) => {
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      title: 'Theme Customization',
      description: 'Personalize your app experience with light, dark, or custom themes.',
      position: { top: 100, left: 50 },
    },
    {
      title: 'Color Customization',
      description: 'Choose your favorite primary and accent colors to make the app truly yours.',
      position: { top: 200, left: 50 },
    },
    {
      title: 'Theme Export/Import',
      description: 'Save your theme configuration and share it with other devices.',
      position: { top: 300, left: 50 },
    },
  ];

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('themeOnboardingCompleted');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.log('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('themeOnboardingCompleted', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('themeOnboardingCompleted', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  if (!showOnboarding) {
    return children;
  }

  const currentStepData = onboardingSteps[currentStep];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    tooltip: {
      position: 'absolute',
      top: currentStepData.position.top,
      left: currentStepData.position.left,
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 12,
      ...theme.elevation.high,
      width: '80%',
    },
    tooltipTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    tooltipDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      padding: 10,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
    },
    skipButton: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    skipButtonText: {
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    progress: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 10,
    },
    progressDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.textSecondary,
      marginHorizontal: 5,
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={showOnboarding}
      >
        <View style={styles.overlay}>
          <View style={styles.tooltip}>
            <View style={styles.progress}>
              {onboardingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.tooltipTitle}>{currentStepData.title}</Text>
            <Text style={styles.tooltipDescription}>{currentStepData.description}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>
                  {currentStep === onboardingSteps.length - 1 ? 'Done' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ThemeOnboarding;