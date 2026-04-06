// filteringLogic.ts

import { fetchStudiesByCondition, PatientProfile, Study } from './api';

// STEP 1: API-BASED FILTERING (using API parameters)
async function applyApiFilters(patient: PatientProfile): Promise<Study[]> {
  console.log('\n🔵 ========== STEP 1: API-BASED FILTERING ==========');
  console.log(
    `📋 Patient Info: ${patient.age}yo, ${patient.gender}, Condition: ${patient.condition}`,
  );

  // Location info if provided
  if (patient.locationName) {
    console.log(`📍 Location filter: ${patient.locationName}`);
  }
  if (patient.latitude && patient.longitude && patient.maxDistance) {
    console.log(
      `📍 Geo filter: Within ${patient.maxDistance}${patient.distanceUnit || 'mi'} of (${patient.latitude}, ${patient.longitude})`,
    );
  }

  // Fetch all studies for the patient's condition with location filters
  console.log(`\n📡 Fetching studies for condition: ${patient.condition}...`);
  let allStudies = await fetchStudiesByCondition(
    patient.condition,
    3, // maxPages
    patient.locationName,
    patient.latitude,
    patient.longitude,
    patient.maxDistance,
    patient.distanceUnit || 'mi',
  );
  console.log(`📦 Total studies fetched: ${allStudies.length}`);

  // Filter by Status = RECRUITING
  console.log(`\n🔍 Filtering by Status = RECRUITING...`);
  let filteredStudies = allStudies.filter((study) => {
    const status = study.protocolSection?.statusModule?.overallStatus;
    return status === 'RECRUITING';
  });
  const removedByStatus = allStudies.length - filteredStudies.length;
  console.log(`   ✅ Kept: ${filteredStudies.length} studies`);
  console.log(`   ❌ Removed: ${removedByStatus} studies (not RECRUITING)`);

  // Filter by Age Range
  console.log(`\n🔍 Filtering by Age Range (patient age: ${patient.age})...`);
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
      const title =
        study.protocolSection?.identificationModule?.briefTitle || 'Unknown';
      console.log(
        `   ❌ Excluded: "${title.substring(0, 50)}..." - Age ${patient.age} not in [${minAge}-${maxAge}]`,
      );
    }

    return isAgeValid;
  });
  console.log(`   ✅ Kept: ${filteredStudies.length} studies`);
  console.log(`   ❌ Removed: ${ageExcludedCount} studies (age mismatch)`);

  // Filter by Gender
  console.log(
    `\n🔍 Filtering by Gender (patient gender: ${patient.gender})...`,
  );
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
      const title =
        study.protocolSection?.identificationModule?.briefTitle || 'Unknown';
      console.log(
        `   ❌ Excluded: "${title.substring(0, 50)}..." - Needs ${requiredSex}, patient is ${patient.gender}`,
      );
    } else if (requiredSex !== 'ALL') {
      console.log(
        `   ✅ Kept: Study requires ${requiredSex} - matches patient`,
      );
    }

    return isGenderValid;
  });
  console.log(`   ✅ Kept: ${filteredStudies.length} studies`);
  console.log(
    `   ❌ Removed: ${genderExcludedCount} studies (gender mismatch)`,
  );

  console.log(
    `\n📊 API Filter Summary: ${filteredStudies.length} studies passed out of ${allStudies.length} total\n`,
  );
  return filteredStudies;
}

// STEP 2: MANUAL FILTERING (text-based from eligibility criteria)
function applyManualFilters(
  patient: PatientProfile,
  studies: Study[],
): Study[] {
  console.log('\n🟢 ========== STEP 2: MANUAL TEXT-BASED FILTERING ==========');
  console.log(`📋 Patient Medical Info:`);
  console.log(`   - Pregnant: ${patient.isPregnant || false}`);
  console.log(
    `   - Recent Major Surgery: ${patient.hasRecentMajorSurgery || false}`,
  );
  console.log(
    `   - Cardiogenic Shock: ${patient.isInCardiogenicShock || false}`,
  );
  console.log(`   - Hemoglobin: ${patient.hemoglobin || 'Not provided'} g/dL`);

  let pregnancyExcluded = 0;
  let surgeryExcluded = 0;
  let shockExcluded = 0;
  let hemoglobinExcluded = 0;

  const filteredStudies = studies.filter((study) => {
    const criteria =
      study.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
    const criteriaLower = criteria.toLowerCase();
    const title =
      study.protocolSection?.identificationModule?.briefTitle || 'Unknown';

    // Pregnancy check
    if (patient.isPregnant) {
      if (
        criteriaLower.includes('pregnant') ||
        criteriaLower.includes('pregnancy')
      ) {
        pregnancyExcluded++;
        console.log(
          `   ❌ Excluded: "${title.substring(0, 50)}..." - Pregnancy exclusion found`,
        );
        return false;
      }
    }

    // Recent major surgery check
    if (patient.hasRecentMajorSurgery) {
      if (
        criteriaLower.includes('major surgery') &&
        criteriaLower.includes('months')
      ) {
        surgeryExcluded++;
        console.log(
          `   ❌ Excluded: "${title.substring(0, 50)}..." - Recent major surgery exclusion found`,
        );
        return false;
      }
    }

    // Cardiogenic shock check
    if (patient.isInCardiogenicShock) {
      if (criteriaLower.includes('cardiogenic shock')) {
        shockExcluded++;
        console.log(
          `   ❌ Excluded: "${title.substring(0, 50)}..." - Cardiogenic shock exclusion found`,
        );
        return false;
      }
    }

    // Hemoglobin check
    if (patient.hemoglobin) {
      const hbMatch = criteria.match(/Hemoglobin\s*<\s*(\d+)/i);
      if (hbMatch && patient.hemoglobin < parseInt(hbMatch[1])) {
        hemoglobinExcluded++;
        console.log(
          `   ❌ Excluded: "${title.substring(0, 50)}..." - Hemoglobin ${patient.hemoglobin} < ${hbMatch[1]} g/dL required`,
        );
        return false;
      }
    }

    return true;
  });

  console.log(`\n📊 Manual Filter Summary:`);
  console.log(`   ✅ Kept: ${filteredStudies.length} studies`);
  console.log(`   ❌ Removed by Pregnancy: ${pregnancyExcluded}`);
  console.log(`   ❌ Removed by Surgery: ${surgeryExcluded}`);
  console.log(`   ❌ Removed by Shock: ${shockExcluded}`);
  console.log(`   ❌ Removed by Hemoglobin: ${hemoglobinExcluded}`);
  console.log(
    `   📊 Started with: ${studies.length} studies, Ended with: ${filteredStudies.length} studies\n`,
  );

  return filteredStudies;
}

// MAIN FUNCTION: Combines both filtering steps
async function matchPatientToTrials(patient: PatientProfile): Promise<Study[]> {
  console.log('\n🚀 ========== STARTING PATIENT MATCHING ==========');
  console.log(
    `👤 Patient: ${patient.age}yo ${patient.gender} with ${patient.condition}`,
  );
  if (patient.locationName) {
    console.log(`📍 Location: ${patient.locationName}`);
  }
  if (patient.latitude && patient.longitude && patient.maxDistance) {
    console.log(
      `📍 Coordinates: (${patient.latitude}, ${patient.longitude}) within ${patient.maxDistance}${patient.distanceUnit || 'mi'}`,
    );
  }
  console.log('================================================\n');

  console.log(`Step 1: Applying API-based filters for ${patient.condition}...`);
  const afterApiFilters = await applyApiFilters(patient);
  console.log(`📊 Studies after API filters: ${afterApiFilters.length}\n`);

  console.log(`Step 2: Applying manual text-based filters...`);
  const finalMatches = applyManualFilters(patient, afterApiFilters);
  console.log(
    `🎯 FINAL RESULT: ${finalMatches.length} matching trials found for this patient`,
  );
  console.log('================================================\n');

  return finalMatches;
}

export { applyApiFilters, applyManualFilters, matchPatientToTrials };
