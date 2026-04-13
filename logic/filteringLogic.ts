import { fetchStudies, PatientProfile, Study } from './api';

// Fetch top matches only (relevance sort, limited to 5 trials)
async function fetchTopMatches(patient: PatientProfile): Promise<Study[]> {
  console.log(
    `\n⭐ Fetching TOP MATCHES (relevance sort) for: ${patient.condition}`,
  );

  const topMatches = await fetchStudies(patient.condition, {
    sortBy: 'relevance',
    maxPages: 1,
    pageSize: 5,
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });

  console.log(`⭐ Top matches found: ${topMatches.length}`);
  return topMatches;
}

// Fetch all trials (date sort, all pages)
async function fetchAllTrials(patient: PatientProfile): Promise<Study[]> {
  console.log(`\n📋 Fetching ALL TRIALS (date sort) for: ${patient.condition}`);

  const allTrials = await fetchStudies(patient.condition, {
    sortBy: 'date',
    locationName: patient.locationName,
    latitude: patient.latitude,
    longitude: patient.longitude,
    maxDistance: patient.maxDistance,
    distanceUnit: patient.distanceUnit || 'km',
  });

  console.log(`📋 All trials found: ${allTrials.length}`);
  return allTrials;
}

// API-BASED FILTERING (status, age, gender only)
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
  console.log(`Total studies fetched from API filter: ${allStudies.length}`);

  // Filter by Status = RECRUITING
  console.log(`\nFiltering by Status = RECRUITING...`);
  let filteredStudies = allStudies.filter((study) => {
    const status = study.protocolSection?.statusModule?.overallStatus;
    return status === 'RECRUITING';
  });
  const removedByStatus = allStudies.length - filteredStudies.length;
  console.log(
    `Kept after recruiting filter: ${filteredStudies.length} studies`,
  );
  console.log(
    `Removed by recruiting filter: ${removedByStatus} studies (not RECRUITING)`,
  );

  // Filter by Age Range
  console.log(`\nFiltering by Age Range (patient age: ${patient.age})...`);
  let ageExcludedCount = 0;
  filteredStudies = filteredStudies.filter((study) => {
    const minAge = parseInt(
      study.protocolSection?.eligibilityModule?.minimumAge || '0',
    );
    const maxAge = parseInt(
      study.protocolSection?.eligibilityModule?.maximumAge || '999',
    );

    const isAgeValid = patient.age >= minAge && patient.age <= maxAge;

    if (!isAgeValid) {
      ageExcludedCount++;
    }

    return isAgeValid;
  });
  console.log(`Kept after age filter: ${filteredStudies.length} studies`);
  console.log(
    `Removed after age filter: ${ageExcludedCount} studies (age mismatch)`,
  );

  // Filter by Gender
  console.log(`\nFiltering by Gender (patient gender: ${patient.gender})...`);
  let genderExcludedCount = 0;
  filteredStudies = filteredStudies.filter((study) => {
    const requiredSex = study.protocolSection?.eligibilityModule?.sex || 'ALL';

    let isGenderValid = true;
    if (requiredSex === 'MALE' && patient.gender !== 'male')
      isGenderValid = false;
    if (requiredSex === 'FEMALE' && patient.gender !== 'female')
      isGenderValid = false;

    if (!isGenderValid) {
      genderExcludedCount++;
    }

    return isGenderValid;
  });
  console.log(`Kept after gender filter: ${filteredStudies.length} studies`);
  console.log(
    `Removed after gender filter: ${genderExcludedCount} studies (gender mismatch)`,
  );

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

  // Fetch top matches (relevance, 5 items)
  const topMatches = await fetchTopMatches(patient);

  // Fetch all trials (date sort, all pages)
  const filteredTrials = await applyApiFilters(patient);

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
