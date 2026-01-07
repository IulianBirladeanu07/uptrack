import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import { COLORS } from '../CreateSplitScreenStyles'
import styles from './BasicInfoStepStyles';

const BasicInfoStep = ({ splitData, handleChange }) => {
  const renderSplitTypeOption = (type, icon, title, subtitle) => {
    const isSelected = splitData.type === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.splitTypeOption, isSelected && styles.splitTypeOptionSelected]}
        onPress={() => handleChange('type', type)}
        activeOpacity={0.8}
      >
        <View style={styles.splitTypeContent}>
          <View style={styles.splitTypeHeader}>
            <View style={[styles.splitTypeIcon, isSelected && styles.splitTypeIconSelected]}>
              <Ionicons
                name={icon}
                size={normalize(20)}
                color={isSelected ? COLORS.bg : COLORS.textMuted}
              />
            </View>
            <View style={styles.splitTypeTextContainer}>
              <Text style={[styles.splitTypeTitle, isSelected && styles.splitTypeTitleSelected]}>
                {title}
              </Text>
              <Text style={[styles.splitTypeSubtitle, isSelected && styles.splitTypeSubtitleSelected]}>
                {subtitle}
              </Text>
            </View>
            <View style={[styles.splitTypeCheck, isSelected && styles.splitTypeCheckSelected]}>
              {isSelected && (
                <Ionicons name="checkmark" size={normalize(14)} color={COLORS.bg} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.orangeIconContainer}>
                  <Feather name="edit" size={normalize(20)} color={COLORS.bg} />
                </View>
                <Text style={styles.sectionHeaderTitle}>Split Details</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Split Name</Text>
              <TextInput
                style={[styles.input, styles.workoutNameInput]}
                placeholder="Enter split name"
                placeholderTextColor={COLORS.textMuted}
                value={splitData.name}
                onChangeText={(text) => handleChange('name', text)}
                returnKeyType="next"
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Describe your workout goals and focus areas..."
                placeholderTextColor={COLORS.textMuted}
                value={splitData.description}
                onChangeText={(text) => handleChange('description', text.length <= 200 ? text : splitData.description)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <View style={styles.noteHelperContainer}>
                <Text style={styles.noteHelper}>Be specific about your goals</Text>
                <Text style={styles.charCount}>{splitData.description.length} / 200</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Split Type</Text>
              <View style={styles.splitTypeContainer}>
                {renderSplitTypeOption('weekly', 'calendar-outline', 'Weekly Schedule', 'Assign workouts to specific days of the week')}
                {renderSplitTypeOption('rotation', 'refresh-outline', 'Flexible Cycle', 'Create a repeating workout pattern with rest days')}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default React.memo(BasicInfoStep);