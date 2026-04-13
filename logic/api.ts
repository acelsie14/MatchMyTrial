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

export interface PatientProfile {
  condition: string;
  age: number;
  gender: 'male' | 'female';
  isPregnant?: boolean;
  hasRecentMajorSurgery?: boolean;
  isInCardiogenicShock?: boolean;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  distanceUnit?: 'mi' | 'km';
  locationName?: string;
}

interface ApiResponse {
  studies?: Study[];
  nextPageToken?: string;
}

// Add FetchOptions interface
interface FetchOptions {
  locationName?: string;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  distanceUnit?: 'mi' | 'km';
  sortBy?: 'relevance' | 'date'; // NEW: control sorting
  maxPages?: number; // NEW: limit number of pages
  pageSize?: number; // NEW: control items per page
}

async function fetchStudies(
  condition: string,
  options: FetchOptions = {},
): Promise<Study[]> {
  // Destructure with defaults
  const {
    locationName,
    latitude,
    longitude,
    maxDistance,
    distanceUnit = 'km',
    sortBy = 'date', // Default to date (newest first)
    maxPages = 20, // Default: fetch all pages (no limit)
    pageSize = 100, // Default: 100 per page
  } = options;

  let allStudies: Study[] = [];
  let nextPageToken: string | null = null;
  let pageCount = 0;

  // Determine sort parameter based on sortBy
  let sortParam = '';
  if (sortBy === 'relevance') {
    sortParam = '&sort=@relevance';
  } else if (sortBy === 'date') {
    sortParam = '&sort=LastUpdatePostDate:desc';
  }

  try {
    // Keep fetching while there's a next page token AND we haven't hit maxPages
    do {
      // Build URL with encoded parameters
      let url = `https://clinicaltrials.gov/api/v2/studies?${sortParam}&pageSize=${pageSize}&format=json`;

      if (condition) {
        url += `&query.cond=${encodeURIComponent(condition)}`;
      }

      // Add location name filter if provided
      if (locationName) {
        url += `&query.locn=${encodeURIComponent(locationName)}`;
      }

      // Add geo distance filter if coordinates provided
      if (latitude && longitude && maxDistance) {
        url += `&filter.geo=distance(${latitude},${longitude},${maxDistance}${distanceUnit})`;
      }

      // Add page token if exists (not on first page)
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }

      console.log(`Fetching page ${pageCount + 1} (sortBy: ${sortBy})...`);
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        break;
      }

      const data: ApiResponse = await response.json();

      if (data.studies && data.studies.length > 0) {
        allStudies.push(...data.studies);
        console.log(
          `Page ${pageCount + 1}: Found ${data.studies.length} studies`,
        );
      } else {
        console.log(`Page ${pageCount + 1}: No studies found`);
      }

      nextPageToken = data.nextPageToken || null;
      pageCount++;

      // STOP if we've reached maxPages
      if (pageCount >= maxPages) {
        console.log(
          `Stopping after ${maxPages} page(s) (${allStudies.length} studies)`,
        );
        break;
      }
    } while (nextPageToken);

    console.log(
      `Fetch complete: ${allStudies.length} total studies from ${pageCount} pages`,
    );
    return allStudies;
  } catch (error) {
    console.error('Error fetching studies:', error);
    return [];
  }
}

export { fetchStudies, type Study };
