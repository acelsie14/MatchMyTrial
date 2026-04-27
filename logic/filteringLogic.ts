import { fetchStudies, PatientProfile, Study } from './api';

// Helper function to apply age, gender, and status filters to any study array
async function applyCoreFilters(
  patient: PatientProfile,
  studies: Study[],
): Promise<Study[]> {
  console.log(`\n🔍 Applying core filters to ${studies.length} studies...`);

  let filteredStudies = studies.filter((study) => {
    const status = study.protocolSection?.statusModule?.overallStatus;
    return status === 'RECRUITING';
  });
  console.log(
    `After status filter (RECRUITING): ${filteredStudies.length} studies`,
  );

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

  const rawTopMatches = await fetchStudies(patient.condition, {
    sortBy: 'relevance',
    maxPages: 1,
    pageSize: 50,
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });

  console.log(`Raw top matches from API: ${rawTopMatches.length}`);

  const filteredMatches = await applyCoreFilters(patient, rawTopMatches);
  const top5Matches = filteredMatches.slice(0, 5);

  console.log(`⭐ Top matches after filters: ${top5Matches.length}`);
  return top5Matches;
}

// NEW: Fetch ONLY first page of trials (20 trials) - FAST initial load
async function fetchFirstPageTrials(patient: PatientProfile): Promise<Study[]> {
  console.log(
    `\n📋 Fetching FIRST PAGE TRIALS (20 trials) for: ${patient.condition}`,
  );

  const rawTrials = await fetchStudies(patient.condition, {
    sortBy: 'date',
    maxPages: 1, // Only 1 page
    pageSize: 40, // Only 20 trials
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });

  console.log(`Raw trials from API: ${rawTrials.length}`);

  const filteredTrials = await applyCoreFilters(patient, rawTrials);

  console.log(`📋 First page trials after filters: ${filteredTrials.length}`);
  return filteredTrials;
}

// Fetch ALL trials (date sort, all pages) - SLOW, only when user clicks "See More"
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

  const filteredTrials = await applyCoreFilters(patient, rawTrials);

  console.log(`📋 All trials after filters: ${filteredTrials.length}`);
  return filteredTrials;
}

// API-BASED FILTERING (kept for backward compatibility)
async function applyApiFilters(patient: PatientProfile): Promise<Study[]> {
  console.log(
    `Patient Info: ${patient.age}yo, ${patient.gender}, Condition: ${patient.condition}`,
  );

  if (patient.locationName) {
    console.log(`Location filter: ${patient.locationName}`);
  }
  if (patient.latitude && patient.longitude && patient.maxDistance) {
    console.log(
      `Geo filter: Within ${patient.maxDistance}${patient.distanceUnit || 'mi'} of (${patient.latitude}, ${patient.longitude})`,
    );
  }

  console.log(`\n📡 Fetching studies for condition: ${patient.condition}...`);
  let allStudies = await fetchStudies(patient.condition, {
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });
  console.log(`Total studies fetched: ${allStudies.length}`);

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

// Combined function that returns top matches (NOT all trials anymore)
async function getTopMatchesOnly(patient: PatientProfile): Promise<{
  topMatches: Study[];
}> {
  console.log('\n🚀 FETCHING TOP MATCHES ONLY');

  const topMatches = await fetchTopMatches(patient);

  return {
    topMatches,
  };
}

export {
  applyApiFilters,
  fetchAllTrials,
  fetchFirstPageTrials,
  fetchTopMatches,
  getTopMatchesOnly,
  matchPatientToTrials,
};
