export interface SelectedDestination {
  id: string;
  subRegions: string[];
}

export interface TripData {
  // STEP 1
  travelerName: string;

  // STEP 2
  groupSize: number;

  // STEP 3
  travelMonths: string[];
  specificDate: string;

  // STEP 4
  journeyType: "pre-defined" | "custom" | "";
  journeyPath: string;

  // STEP 5
  lengthOfStay: string;
  customLengthOfStay?: number;

  // STEP 6 – Golf
  includesGolf: boolean;
  golfRounds?: number;
mustHaveGolfCourses?: string[];

  // STEP 7 – Destinations
  destinations: SelectedDestination[];

  // STEP 8 – Experiences
  experiences: string[];

  // STEP 9 – Accommodation
  accommodationFeel: string;
  accommodationTypes: string[];

  // STEP 10 – Pace
  pace: "relaxed" | "balanced" | "active" | "";

  // STEP 11 – Notes
  generalNotes: string;
}
