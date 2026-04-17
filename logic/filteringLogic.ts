import { fetchStudies, PatientProfile, Study } from './api';

// Helper function to apply age, gender, and status filters to any study array
async function applyCoreFilters(
  patient: PatientProfile,
  studies: Study[],
): Promise<Study[]> {
  console.log(`\n🔍 Applying core filters to ${studies.length} studies...`);

  // Filter by Status = RECRUITING
  let filteredStudies = studies.filter((study) => {
    const status = study.protocolSection?.statusModule?.overallStatus;
    return status === 'RECRUITING';
  });
  console.log(
    `After status filter (RECRUITING): ${filteredStudies.length} studies`,
  );

  // Filter by Age Range
  filteredStudies = filteredStudies.filter((study) => {
    const minAge = parseInt(
      study.protocolSection?.eligibilityModule?.minimumAge || '0',
    );
    const maxAge = parseInt(
      study.protocolSection?.eligibilityModule?.maximumAge || '999',
    );

    return patient.age >= minAge && patient.age <= maxAge;
  });
  console.log(`After age filter: ${filteredStudies.length} studies`);

  // Filter by Gender
  filteredStudies = filteredStudies.filter((study) => {
    const requiredSex = study.protocolSection?.eligibilityModule?.sex || 'ALL';

    if (requiredSex === 'MALE' && patient.gender !== 'male') return false;
    if (requiredSex === 'FEMALE' && patient.gender !== 'female') return false;
    return true;
  });
  console.log(`After gender filter: ${filteredStudies.length} studies`);

  return filteredStudies;
}

// Fetch top matches only (relevance sort, limited to 5 trials) WITH filters applied
async function fetchTopMatches(patient: PatientProfile): Promise<Study[]> {
  console.log(
    `\n⭐ Fetching TOP MATCHES (relevance sort) for: ${patient.condition}`,
  );

  // Fetch raw trials from API
  const rawTopMatches = await fetchStudies(patient.condition, {
    sortBy: 'relevance',
    maxPages: 5, // Limit to first 5 pages for performance
    pageSize: 100, // Fetch more then filter down to 5
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });

  console.log(`Raw top matches from API: ${rawTopMatches.length}`);

  // Apply age, gender, status filters
  const filteredMatches = await applyCoreFilters(patient, rawTopMatches);

  // Take only top 5 after filtering
  const top5Matches = filteredMatches.slice(0, 5);

  console.log(`⭐ Top matches after filters: ${top5Matches.length}`);
  return top5Matches;
}

// Fetch all trials (date sort, all pages) WITH filters applied
async function fetchAllTrials(patient: PatientProfile): Promise<Study[]> {
  console.log(`\n📋 Fetching ALL TRIALS (date sort) for: ${patient.condition}`);

  const rawTrials = await fetchStudies(patient.condition, {
    sortBy: 'date',
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });

  console.log(`Raw trials from API: ${rawTrials.length}`);

  // Apply age, gender, status filters
  const filteredTrials = await applyCoreFilters(patient, rawTrials);

  console.log(`📋 All trials after filters: ${filteredTrials.length}`);
  return filteredTrials;
}

// API-BASED FILTERING (kept for backward compatibility)
async function applyApiFilters(patient: PatientProfile): Promise<Study[]> {
  console.log(
    `Patient Info: ${patient.age}yo, ${patient.gender}, Condition: ${patient.condition}`,
  );

  // Location info if provided
  if (patient.locationName) {
    console.log(`Location filter: ${patient.locationName}`);
  }
  if (patient.latitude && patient.longitude && patient.maxDistance) {
    console.log(
      `Geo filter: Within ${patient.maxDistance}${patient.distanceUnit || 'mi'} of (${patient.latitude}, ${patient.longitude})`,
    );
  }

  // Fetch all studies for the patient's condition with location filters
  console.log(`\n📡 Fetching studies for condition: ${patient.condition}...`);
  let allStudies = await fetchStudies(patient.condition, {
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });
  console.log(`Total studies fetched: ${allStudies.length}`);

  // Apply core filters
  const filteredStudies = await applyCoreFilters(patient, allStudies);

  console.log(
    `\nAPI Filter Summary: ${filteredStudies.length} studies passed out of ${allStudies.length} total\n`,
  );
  return filteredStudies;
}

// Main function that applies all filters
async function matchPatientToTrials(patient: PatientProfile): Promise<Study[]> {
  console.log('\n========== STARTING PATIENT MATCHING ==========');
  console.log(
    `Patient: ${patient.age}yo ${patient.gender} with ${patient.condition}`,
  );
  if (patient.locationName) {
    console.log(`Location: ${patient.locationName}`);
  }
  if (patient.latitude && patient.longitude && patient.maxDistance) {
    console.log(
      `Coordinates: (${patient.latitude}, ${patient.longitude}) within ${patient.maxDistance}${patient.distanceUnit || 'mi'}`,
    );
  }

  const afterApiFilters = await applyApiFilters(patient);
  console.log(`Final result: ${afterApiFilters.length} matching trials found`);
  console.log('================================================\n');

  return afterApiFilters;
}

// Combined function that returns both top matches and all trials
async function getTopAndAllMatches(patient: PatientProfile): Promise<{
  topMatches: Study[];
  filteredTrials: Study[];
}> {
  console.log('\n🚀 FETCHING BOTH TOP MATCHES AND ALL TRIALS');

  // Fetch top matches with filters applied
  const topMatches = await fetchTopMatches(patient);

  // Fetch all trials with filters applied
  const filteredTrials = await fetchAllTrials(patient);

  return {
    topMatches,
    filteredTrials,
  };
}

export {
  applyApiFilters,
  fetchAllTrials,
  fetchTopMatches,
  getTopAndAllMatches,
  matchPatientToTrials,
};
