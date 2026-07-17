export type FeedbackEntry = {
  id: string;
  rating: number;
  label: string;
  emoji: string;
  createdAt: string;
};

export type NewFeedbackEntry = Omit<FeedbackEntry, "id" | "createdAt">;

export const ratings = [
  { value: 5, emoji: "😍", image: "/ratings/excellent.png", label: "Excellent" },
  { value: 4, emoji: "🙂", image: "/ratings/good.png", label: "Good" },
  { value: 3, emoji: "😐", image: "/ratings/okay.png", label: "Okay" },
  { value: 2, emoji: "😟", image: "/ratings/poor.png", label: "Poor" },
  { value: 1, emoji: "😡", image: "/ratings/very-poor.png", label: "Very Poor" }
];
