import { useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

import Collapsible from 'react-native-collapsible';
import PropTypes from 'prop-types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { styles, COLORS } from './FitnessProfileSummaryModalStyle';

// Icons for each section
const SECTION_ICONS = {
  planProgress: 'chart-timeline-variant',
  userProfile: 'account-details',
  nutritionOverview: 'food-apple',
  additionalNotes: 'text-box',
};

// Returns an appropriate icon for the note type
const getIconForNoteType = (type) => {
  switch (type) {
    case 'goal': return 'trophy';
    case 'instruction': return 'book-open-variant';
    case 'warning': return 'alert-circle';
    case 'tip': return 'lightbulb-on';
    default: return 'information';
  }
};

// Returns background color for note type
const getIconBackgroundColor = (type) => {
  switch (type) {
    case 'goal': return '#FFC107';
    case 'instruction': return '#F4A261';
    case 'warning': return '#E63946';
    case 'tip': return '#43AA8B';
    default: return '#9E9E9E';
  }
};

// Utility to format goal names
const getFormattedGoalName = (goalType) => {
  switch (goalType) {
    case 'muscle_gain': return 'Muscle Gain';
    case 'weight_loss': return 'Weight Loss';
    case 'maintenance': return 'Weight Maintenance';
    default: return 'Unknown Goal';
  }
};

const AccordionSection = ({ title, iconName, color, expanded, toggleExpanded, children }) => (
  <View style={[styles.accordionContainer, expanded && styles.expandedAccordion]}>
    <TouchableOpacity
      style={[styles.accordionHeader, expanded && styles.accordionHeaderExpanded]}
      onPress={toggleExpanded}
      accessible={true}
      accessibilityLabel={`${title} section toggle`}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={iconName} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.accordionTitle}>{title}</Text>
      <MaterialCommunityIcons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={24}
        color={COLORS.textPrimary}
      />
    </TouchableOpacity>
    <Collapsible collapsed={!expanded} style={styles.collapsibleContent}>
      <View style={styles.accordionContent}>{children}</View>
    </Collapsible>
  </View>
);

// Macro Item Component for Visual Representation
const MacroItem = ({ label, value, percentage, color, iconName }) => (
  <View style={styles.macroItem}>
    <View style={[styles.macroIconContainer, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={iconName} size={24} color="#FFFFFF" />
    </View>
    <View style={styles.macroDetails}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}g</Text>
      <View style={styles.percentageContainer}>
        <Text style={[styles.macroPercentage, { color }]}>{percentage || 0}%</Text>
      </View>
    </View>
  </View>
);

// Note Component for better visualization
const NoteCard = ({ type, text }) => (
  <View style={styles.noteCardContainer}>
    <View style={[styles.noteIconContainer, { backgroundColor: getIconBackgroundColor(type) }]}>
      <MaterialCommunityIcons name={getIconForNoteType(type)} size={18} color="#FFFFFF" />
    </View>
    <View style={styles.noteTextContainer}>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  </View>
);

const FitnessProfileSummaryModal = ({ visible, onClose, formData, weightChangePlan, onContinue }) => {
  const [expandedSection, setExpandedSection] = useState('planProgress');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSection = useCallback((section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  // Render the macros section
  const renderMacros = (macros = {}, percentages = {}) => {
    const macroConfig = [
      { key: 'protein', label: 'Protein', color: COLORS.protein },
      { key: 'carbs', label: 'Carbs', color: COLORS.carbs },
      { key: 'fats', label: 'Fats', color: COLORS.fats },
    ];

    return (
      <View style={styles.macrosContainer}>
        {macroConfig.map(({ key, label, color, iconName }) => (
          <MacroItem
            key={key}
            label={label}
            value={macros[key] || 0}
            percentage={percentages[key] || 0}
            color={color}
            iconName={iconName}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.gradientBackground, { backgroundColor: COLORS.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Summary</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.accent} />
              ) : (
                <>
                  {/* Plan & Progress */}
                  <AccordionSection
                    title="Plan Overview"
                    iconName={SECTION_ICONS.planProgress}
                    color="#3F51B5"
                    expanded={expandedSection === 'planProgress'}
                    toggleExpanded={() => toggleSection('planProgress')}
                  >
                    <View style={[styles.dataCard, styles.goalCard]}>
                      <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="bullseye-arrow" size={22} color={'#3F51B5'} />
                        <Text style={styles.dataLabel}>Goal:</Text>
                        <Text style={styles.dataValue}>{getFormattedGoalName(weightChangePlan.type)}</Text>
                      </View>

                      <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="scale-balance" size={22} color={'#3F51B5'} />
                        <Text style={styles.dataLabel}>
                          {weightChangePlan.type === 'muscle_gain' ? 'Target Gain:' : 
                           weightChangePlan.type === 'weight_loss' ? 'Target Loss:' : 'Maintenance:'}
                        </Text>
                        <Text style={styles.dataValue}>
                          {weightChangePlan.type === 'muscle_gain' && `${weightChangePlan.ratePerMonth} kg/month`}
                          {weightChangePlan.type === 'weight_loss' && `${weightChangePlan.ratePerWeek} kg/week`}
                          {weightChangePlan.type === 'maintenance' && '0 kg/week'}
                        </Text>
                      </View>

                      <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="calendar-range" size={22} color={'#3F51B5'} />
                        <Text style={styles.dataLabel}>Duration:</Text>
                        <Text style={styles.dataValue}>{weightChangePlan.weeksToGoal} weeks</Text>
                      </View>
                    </View>
                  </AccordionSection>

                  {/* User Profile */}
                  <AccordionSection
                    title="User Profile"
                    iconName={SECTION_ICONS.userProfile}
                    color="#009688"
                    expanded={expandedSection === 'userProfile'}
                    toggleExpanded={() => toggleSection('userProfile')}
                  >
                    <View style={styles.dataCard}>
                      <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="calendar-account" size={22} color="#009688" />
                        <Text style={styles.dataLabel}>Age:</Text>
                        <Text style={styles.dataValue}>{formData.age || 'N/A'}</Text>
                      </View>

                      <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="human-male-height" size={22} color="#009688" />
                        <Text style={styles.dataLabel}>Height:</Text>
                        <Text style={styles.dataValue}>{formData.height || 'N/A'} cm</Text>
                      </View>

                      <View style={styles.dataRow}>
                        <MaterialCommunityIcons name="weight" size={22} color="#009688" />
                        <Text style={styles.dataLabel}>Weight:</Text>
                        <Text style={styles.dataValue}>{formData.currentWeight || 'N/A'} kg</Text>
                      </View>
                    </View>
                  </AccordionSection>

                  {/* Nutrition Overview */}
                  <AccordionSection
                    title="Nutrition Overview"
                    iconName={SECTION_ICONS.nutritionOverview}
                    color="#E91E63"
                    expanded={expandedSection === 'nutritionOverview'}
                    toggleExpanded={() => toggleSection('nutritionOverview')}
                  >
                    {/* Calories Card */}
                    <View style={styles.caloriesCard}>
                      <Text style={styles.caloriesLabel}>Target Calories</Text>
                      <Text style={styles.caloriesValue}>{weightChangePlan.goalCalories} kcal</Text>
                    </View>

                    {/* Macros Section */}
                    <Text style={styles.sectionTitle}>Daily Macronutrients</Text>
                    {renderMacros(weightChangePlan.macros, weightChangePlan.macroPercentages)}
                  </AccordionSection>

                  {/* Additional Notes */}
                  <AccordionSection
                    title="Additional Notes"
                    iconName={SECTION_ICONS.additionalNotes}
                    color="#FFC107"
                    expanded={expandedSection === 'additionalNotes'}
                    toggleExpanded={() => toggleSection('additionalNotes')}
                  >
                    {weightChangePlan.notes && weightChangePlan.notes.length > 0 ? (
                      weightChangePlan.notes.map((note, index) => (
                        <NoteCard key={index} type={note.type} text={note.text} />
                      ))
                    ) : (
                      <Text style={styles.noNotesText}>No additional notes available.</Text>
                    )}
                  </AccordionSection>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={onContinue}
              style={styles.continueButton}
              accessible={true}
              accessibilityLabel="Continue to Next Step"
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

FitnessProfileSummaryModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  weightChangePlan: PropTypes.object.isRequired,
  onContinue: PropTypes.func.isRequired,
};

export default FitnessProfileSummaryModal;