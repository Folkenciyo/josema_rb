export const queryKeys = {
  currentTrainer: ["auth", "me"] as const,
  alerts: ["alerts"] as const,
  inviteTemplates: ["settings", "invite-templates"] as const,
  questionnaire: ["settings", "questionnaire"] as const,
  clientQuestionnaire: (clientId: string) =>
    ["clients", clientId, "questionnaire"] as const,
  portalQuestionnaire: (token: string) =>
    ["portal", token, "questionnaire"] as const,
  clients: (includeInactive: boolean) =>
    ["clients", { includeInactive }] as const,
  client: (clientId: string) => ["clients", clientId] as const,
  measurements: (clientId: string) =>
    ["clients", clientId, "measurements"] as const,
  bodyMeasurements: (clientId: string) =>
    ["clients", clientId, "body-measurements"] as const,
  photos: (clientId: string) => ["clients", clientId, "photos"] as const,
  portalInvite: (clientId: string) =>
    ["clients", clientId, "portal-invite"] as const,
  portalHome: (token: string) => ["portal", token] as const,
  portalTrainingPlan: (token: string) =>
    ["portal", token, "training-plan"] as const,
  portalDietPlan: (token: string) => ["portal", token, "diet-plan"] as const,
  portalMeasurements: (token: string) =>
    ["portal", token, "measurements"] as const,
  portalBodyMeasurements: (token: string) =>
    ["portal", token, "body-measurements"] as const,
  workoutDays: (token: string) => ["portal", token, "workout-days"] as const,
  workoutDay: (token: string, dayId: string) =>
    ["portal", token, "workout-days", dayId] as const,
  portalWorkouts: (token: string) => ["portal", token, "workouts"] as const,
  portalPhotos: (token: string) => ["portal", token, "photos"] as const,
  portalTrainedExercises: (token: string) =>
    ["portal", token, "trained-exercises"] as const,
  portalExerciseHistory: (token: string, exerciseId: string) =>
    ["portal", token, "exercise-history", exerciseId] as const,
  clientWorkouts: (clientId: string) =>
    ["clients", clientId, "workouts"] as const,
  trainingCalendar: (clientId: string, since: string, until: string) =>
    ["clients", clientId, "training-calendar", since, until] as const,
  trainedExercises: (clientId: string) =>
    ["clients", clientId, "trained-exercises"] as const,
  exerciseHistory: (clientId: string, exerciseId: string) =>
    ["clients", clientId, "exercise-history", exerciseId] as const,
  quotes: ["quotes"] as const,
  // Nested under "quotes" so any change to the library refreshes the queue too.
  quoteQueue: (days: number) => ["quotes", "queue", days] as const,
  pinnedQuote: (clientId: string) => ["clients", clientId, "quote"] as const,
};
