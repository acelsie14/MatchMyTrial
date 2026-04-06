// api.ts

interface Study {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
    };
    conditionsModule?: {
      conditions?: string[];
    };
    eligibilityModule?: {
      minimumAge?: string;
      maximumAge?: string;
      sex?: string;
      eligibilityCriteria?: string;
    };
    statusModule?: {
      overallStatus?: string;
    };
    contactsLocationsModule?: {
      locations?: {
        facility?: string;
        city?: string;
        state?: string;
        country?: string;
        geoPoint?: {
          lat?: number;
          lng?: number;
        };
      }[];
    };
  };
}

interface ApiResponse {
  studies?: Study[];
  nextPageToken?: string;
}

export interface PatientProfile {
  condition: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  isPregnant?: boolean;
  hasRecentMajorSurgery?: boolean;
  isInCardiogenicShock?: boolean;
  hemoglobin?: number;
  // New location fields
  latitude?: number;
  longitude?: number;
  maxDistance?: number; // in miles or km
  distanceUnit?: 'mi' | 'km';
  locationName?: string; // city, state, or country name
}

async function fetchStudiesByCondition(
  condition: string = 'diabetes',
  maxPages: number = 3,
  locationName?: string,
  latitude?: number,
  longitude?: number,
  maxDistance?: number,
  distanceUnit: 'mi' | 'km' = 'mi',
): Promise<Study[]> {
  let allStudies: Study[] = [];
  let nextPageToken: string | null = null;
  let pageCount = 0;

  do {
    // Start building URL
    let url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&pageSize=20&format=json`;

    // Add location name filter if provided
    if (locationName) {
      url += `&query.locn=${encodeURIComponent(locationName)}`;
    }

    // Add geo distance filter if coordinates provided
    if (latitude && longitude && maxDistance) {
      url += `&filter.geo=distance(${latitude},${longitude},${maxDistance}${distanceUnit})`;
    }

    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }

    console.log(`Fetching page ${pageCount + 1}...`);
    const response = await fetch(url);
    const data: ApiResponse = await response.json();

    // Add studies from this page
    if (data.studies && data.studies.length > 0) {
      allStudies.push(...data.studies);
    }

    // Get token for next page
    nextPageToken = data.nextPageToken || null;
    pageCount++;

    // STOP after maxPages
    if (pageCount >= maxPages) {
      console.log(
        `Stopping after ${maxPages} pages (${allStudies.length} studies)`,
      );
      break;
    }
  } while (nextPageToken);

  return allStudies;
}

export { fetchStudiesByCondition, type Study };
