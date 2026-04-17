import { Colors } from '@/constants/colors';
import {
  isBookmarked,
  removeBookmark,
  saveBookmark,
} from '@/services/bookmarkService';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ========== TYPES ==========
interface Trial {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: {
        date?: string;
      };
      primaryCompletionDateStruct?: {
        date?: string;
      };
      completionDateStruct?: {
        date?: string;
      };
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: {
      conditions?: string[];
    };
    designModule?: {
      studyType?: string;
      phases?: string[];
      enrollmentInfo?: {
        count?: number;
      };
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    contactsLocationsModule?: {
      centralContacts?: Contact[];
      locations?: Location[];
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: {
        name?: string;
      };
    };
    armsInterventionsModule?: {
      interventions?: Intervention[];
    };
  };
}

interface Contact {
  name?: string;
  phone?: string;
  email?: string;
}

interface Location {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface Intervention {
  type?: string;
  name?: string;
  description?: string;
}
// ========== END TYPES ==========

export default function TrialDetailsScreen() {
  const params = useLocalSearchParams();
  const trialParam = params.trial as string;
  const trialIdParam = params.trialId as string;
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    const loadTrialData = async () => {
      // Case 1: Full trial object was passed (from home screen)
      if (trialParam) {
        try {
          const parsedTrial = JSON.parse(trialParam);
          setTrial(parsedTrial);
          setLoading(false);
          checkBookmarkStatus(parsedTrial);
          return;
        } catch (err) {
          console.error('Error parsing trial param:', err);
        }
      }

      // Case 2: trialId was passed (from bookmarks)
      if (trialIdParam) {
        console.log('Fetching trial from API:', trialIdParam);

        try {
          // Fetch from ClinicalTrials.gov API
          const response = await fetch(
            `https://clinicaltrials.gov/api/v2/studies?query.cond=${trialIdParam}&pageSize=1&format=json`,
          );

          if (!response.ok) {
            throw new Error('Failed to fetch trial data');
          }

          const data = await response.json();

          if (data.studies && data.studies.length > 0) {
            const fetchedTrial = data.studies[0];
            setTrial(fetchedTrial);
            setLoading(false);
            checkBookmarkStatus(fetchedTrial);
            return;
          } else {
            throw new Error('Trial not found');
          }
        } catch (err) {
          console.error('Error fetching trial:', err);
          setError('Could not load trial details. Please try again.');
          setLoading(false);
          return;
        }
      }

      // No data at all
      setError('Could not load trial details');
      setLoading(false);
    };

    loadTrialData();
  }, [trialParam, trialIdParam]);

  const checkBookmarkStatus = async (currentTrial: Trial) => {
    const user = auth().currentUser;
    if (!user || !currentTrial) return;

    const trialId = currentTrial.protocolSection?.identificationModule?.nctId;
    if (!trialId) return;

    const bookmarked = await isBookmarked(user.uid, trialId);
    setIsSaved(bookmarked);
  };

  const handleBookmark = async () => {
    const user = auth().currentUser;
    if (!user) {
      alert('Please log in to save trials');
      return;
    }

    if (!trial) return;

    const trialId = trial.protocolSection?.identificationModule?.nctId;
    if (!trialId) return;

    setBookmarkLoading(true);
    try {
      if (isSaved) {
        await removeBookmark(user.uid, trialId);
        setIsSaved(false);
      } else {
        await saveBookmark(user.uid, trial);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error with bookmark:', error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Helper functions
  const getBriefTitle = (): string => {
    return (
      trial?.protocolSection?.identificationModule?.briefTitle ||
      'Untitled Trial'
    );
  };

  const getOfficialTitle = (): string => {
    return (
      trial?.protocolSection?.identificationModule?.officialTitle ||
      'No official title available'
    );
  };

  const getStatus = (): string => {
    return trial?.protocolSection?.statusModule?.overallStatus || 'Unknown';
  };

  const getConditionsList = (): string => {
    const conditions = trial?.protocolSection?.conditionsModule?.conditions;
    if (conditions && conditions.length > 0) {
      return conditions.join(', ');
    }
    return 'Not specified';
  };

  const getBriefSummary = (): string => {
    return (
      trial?.protocolSection?.descriptionModule?.briefSummary ||
      'No summary available'
    );
  };

  const getDetailedDescription = (): string => {
    return (
      trial?.protocolSection?.descriptionModule?.detailedDescription ||
      'No detailed description available'
    );
  };

  const getEligibilityCriteria = (): string => {
    return (
      trial?.protocolSection?.eligibilityModule?.eligibilityCriteria ||
      'No eligibility criteria available'
    );
  };

  const getLocations = (): Location[] => {
    return trial?.protocolSection?.contactsLocationsModule?.locations || [];
  };

  const getPhase = (): string => {
    const phases = trial?.protocolSection?.designModule?.phases;
    if (phases && phases.length > 0) {
      return phases.join(', ');
    }
    return 'Not specified';
  };

  const getEnrollment = (): string => {
    const enrollment =
      trial?.protocolSection?.designModule?.enrollmentInfo?.count;
    if (enrollment) {
      return `${enrollment} participants`;
    }
    return 'Not specified';
  };

  const getConditions = (): string => {
    const conditions = trial?.protocolSection?.conditionsModule?.conditions;
    if (conditions && conditions.length > 0) {
      return conditions.join(', ');
    }
    return 'Not specified';
  };

  const getSponsor = (): string => {
    return (
      trial?.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name ||
      'Not specified'
    );
  };

  const getContacts = (): Contact[] => {
    return (
      trial?.protocolSection?.contactsLocationsModule?.centralContacts || []
    );
  };

  const getNctId = (): string => {
    return (
      trial?.protocolSection?.identificationModule?.nctId || 'Not specified'
    );
  };

  const getStartDate = (): string => {
    return (
      trial?.protocolSection?.statusModule?.startDateStruct?.date ||
      'Not specified'
    );
  };

  const getPrimaryCompletionDate = (): string => {
    return (
      trial?.protocolSection?.statusModule?.primaryCompletionDateStruct?.date ||
      'Not specified'
    );
  };

  const getCompletionDate = (): string => {
    return (
      trial?.protocolSection?.statusModule?.completionDateStruct?.date ||
      'Not specified'
    );
  };

  const getStudyType = (): string => {
    return trial?.protocolSection?.designModule?.studyType || 'Not specified';
  };

  const getInterventions = (): Intervention[] => {
    return trial?.protocolSection?.armsInterventionsModule?.interventions || [];
  };

  // Get unique intervention types to avoid duplicates
  const getUniqueInterventions = (): Intervention[] => {
    const interventions = getInterventions();
    const seen = new Set();
    return interventions.filter((intervention) => {
      const key = intervention.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  // Split eligibility criteria into inclusion and exclusion
  const splitEligibilityCriteria = (): {
    inclusion: string;
    exclusion: string;
  } => {
    const criteria = getEligibilityCriteria();
    const inclusionMatch = criteria.match(
      /Inclusion Criteria:([\s\S]*?)(?=Exclusion Criteria:|$)/i,
    );
    const exclusionMatch = criteria.match(/Exclusion Criteria:([\s\S]*?)$/i);

    return {
      inclusion: inclusionMatch ? inclusionMatch[1].trim() : criteria,
      exclusion: exclusionMatch
        ? exclusionMatch[1].trim()
        : 'No exclusion criteria specified',
    };
  };

  // Split emails if multiple
  const splitEmails = (emailString?: string): string[] => {
    if (!emailString) return [];
    return emailString.split(/[;, ]+/).filter((e) => e.includes('@'));
  };

  // Handle phone press
  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^0-9]/g, '')}`);
  };

  // Handle email press
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const { inclusion, exclusion } = splitEligibilityCriteria();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading trial details...</Text>
      </View>
    );
  }

  if (error || !trial) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Trial not found'}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with back button and bookmark icon */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trial Details</Text>
        <TouchableOpacity
          onPress={handleBookmark}
          disabled={bookmarkLoading}
          style={styles.bookmarkButton}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Badge and Condition Row */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{getStatus()}</Text>
          </View>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{getConditionsList()}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.officialTitle}>{getOfficialTitle()}</Text>

        {/* Brief Summary - Highlighted */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>{getBriefSummary()}</Text>
        </View>

        {/* Study Identifiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Identifiers</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>NCT Number:</Text>
            <Text style={styles.infoValue}>{getNctId()}</Text>
          </View>
        </View>

        {/* Study Details Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Details</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Phase</Text>
              <Text style={[styles.gridValue, styles.phaseValue]}>
                {getPhase()}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Enrollment</Text>
              <Text style={styles.gridValue}>{getEnrollment()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Sponsor</Text>
              <Text style={styles.gridValue}>{getSponsor()}</Text>
            </View>
          </View>
        </View>

        {/* Study Timeline Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Timeline</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Study Type</Text>
              <Text style={styles.gridValue}>{getStudyType()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Start Date</Text>
              <Text style={styles.gridValue}>{getStartDate()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Primary Completion</Text>
              <Text style={styles.gridValue}>{getPrimaryCompletionDate()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Study Completion</Text>
              <Text style={styles.gridValue}>{getCompletionDate()}</Text>
            </View>
          </View>
        </View>

        {/* Interventions */}
        {getUniqueInterventions().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interventions / Treatments</Text>
            <View style={styles.interventionsContainer}>
              {getUniqueInterventions().map(
                (intervention: Intervention, index: number) => (
                  <View key={index} style={styles.interventionChip}>
                    <Text style={styles.interventionChipText}>
                      {intervention.name || intervention.type || 'Treatment'}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>
        )}

        {/* Eligibility Criteria - Split into Inclusion and Exclusion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility Criteria</Text>

          <Text style={styles.subSectionTitle}>Inclusion Criteria</Text>
          <View style={styles.criteriaContainer}>
            <Text style={styles.criteriaText}>{inclusion}</Text>
          </View>

          <Text style={styles.subSectionTitle}>Exclusion Criteria</Text>
          <View style={styles.criteriaContainer}>
            <Text style={styles.criteriaText}>{exclusion}</Text>
          </View>
        </View>

        {/* Locations - Two in a row */}
        {getLocations().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations</Text>
            <View style={styles.locationsGrid}>
              {getLocations().map((location: Location, index: number) => (
                <View key={index} style={styles.locationCard}>
                  <Text style={styles.locationFacility}>
                    {location.facility || 'Facility'}
                  </Text>
                  <Text style={styles.locationAddress}>
                    {[location.city, location.state, location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contacts - Two in a row with clickable phone/email */}
        {getContacts().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactsGrid}>
              {getContacts().map((contact: Contact, index: number) => {
                const emails = splitEmails(contact.email);
                return (
                  <View key={index} style={styles.contactCard}>
                    <Text style={styles.contactName}>
                      {contact.name || 'Contact'}
                    </Text>
                    {contact.phone && (
                      <TouchableOpacity
                        onPress={() => handlePhonePress(contact.phone!)}
                      >
                        <Text style={styles.contactDetail}>
                          📞 {contact.phone}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {emails.map((email, emailIndex) => (
                      <TouchableOpacity
                        key={emailIndex}
                        onPress={() => handleEmailPress(email)}
                      >
                        <Text style={styles.contactDetail}>✉️ {email}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Detailed Description */}
        {getDetailedDescription() !== 'No detailed description available' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Description</Text>
            <Text style={styles.descriptionText}>
              {getDetailedDescription()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  bookmarkButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  // Status row with condition
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 16,
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  conditionBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  officialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 28,
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  summaryText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  phaseValue: {
    color: Colors.primary,
  },
  interventionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  interventionChip: {
    backgroundColor: `${Colors.primary}12`,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  interventionChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  criteriaContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  criteriaText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  locationCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  locationFacility: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  contactCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
});
