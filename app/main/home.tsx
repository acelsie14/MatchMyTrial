import { logout } from '@/services/authServices';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PatientProfile, Study } from '../../logic/api';
import { getTopAndAllMatches } from '../../logic/filteringLogic';

export default function TestScreen() {
  const [matches, setMatches] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  const runTest = async () => {
    setLoading(true);
    setTestResult('Running tests...');

    try {
      // Test patient WITH location filters
      const patient: PatientProfile = {
        condition: 'fibroid',
        age: 25,
        gender: 'female',
        // Location filters - choose ONE of these methods:

        // Method 1: Search by location name (city, state, or country)
        locationName: 'chicago', // Finds trials in New York

        // Method 2: Search by coordinates (uncomment to use)
        // latitude: 40.7128,
        // longitude: -74.0060,
        // maxDistance: 50,
        // distanceUnit: 'mi', // 'mi' for miles, 'km' for kilometers
      };

      const results = await getTopAndAllMatches(patient);
      setMatches(results.filteredTrials);
      setTestResult(
        `✅ Found ${results.filteredTrials.length} matching trials`,
      );
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Test without location
  const runTestWithoutLocation = async () => {
    setLoading(true);
    setTestResult('Running tests without location...');

    try {
      const patient: PatientProfile = {
        condition: 'cancer',
        age: 40,
        gender: 'female',
        isPregnant: false,
        hasRecentMajorSurgery: false,
        isInCardiogenicShock: false,

        // No location filters
      };

      const results = await getTopAndAllMatches(patient);
      setMatches(results.filteredTrials);
      setTestResult(
        `✅ Found ${results.filteredTrials.length} matching trials (no location filter)`,
      );
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        Filtering Logic Test
      </Text>

      <Button title="Run Test WITH Location" onPress={runTest} />

      <View style={{ marginTop: 10 }}>
        <Button
          title="Run Test WITHOUT Location"
          onPress={runTestWithoutLocation}
        />
      </View>
      <TouchableOpacity
        onPress={logout}
        style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: '#EF4444',
          borderRadius: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {testResult ? (
        <Text style={{ marginTop: 20, fontSize: 16, color: 'green' }}>
          {testResult}
        </Text>
      ) : null}

      {matches.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Sample Matches:</Text>
          {matches.slice(0, matches.length).map((trial, index) => (
            <View
              key={index}
              style={{ marginTop: 10, padding: 10, borderWidth: 1 }}
            >
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Title:</Text>{' '}
                {trial.protocolSection?.identificationModule?.briefTitle}
              </Text>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Status:</Text>{' '}
                {trial.protocolSection?.statusModule?.overallStatus}
              </Text>
              {/* Display location if available */}
              {trial.protocolSection?.contactsLocationsModule
                ?.locations?.[0] && (
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>Location:</Text>{' '}
                  {
                    trial.protocolSection.contactsLocationsModule.locations[0]
                      .city
                  }
                  ,
                  {
                    trial.protocolSection.contactsLocationsModule.locations[0]
                      .country
                  }
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
