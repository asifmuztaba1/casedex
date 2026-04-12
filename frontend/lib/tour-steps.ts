export type TourStep = {
  target: string;
  titleKey: string;
  descriptionKey: string;
  placement: "top" | "bottom" | "left" | "right";
  center?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    target: "",
    titleKey: "tour.welcome.title",
    descriptionKey: "tour.welcome.desc",
    placement: "bottom",
    center: true,
  },
  {
    target: '[data-tour="sidebar-nav"]',
    titleKey: "tour.sidebar.title",
    descriptionKey: "tour.sidebar.desc",
    placement: "right",
  },
  {
    target: '[data-tour="nav-cases"]',
    titleKey: "tour.cases.title",
    descriptionKey: "tour.cases.desc",
    placement: "right",
  },
  {
    target: '[data-tour="nav-hearings"]',
    titleKey: "tour.hearings.title",
    descriptionKey: "tour.hearings.desc",
    placement: "right",
  },
  {
    target: '[data-tour="nav-documents"]',
    titleKey: "tour.documents.title",
    descriptionKey: "tour.documents.desc",
    placement: "right",
  },
  {
    target: '[data-tour="nav-ai"]',
    titleKey: "tour.ai.title",
    descriptionKey: "tour.ai.desc",
    placement: "right",
  },
  {
    target: '[data-tour="dashboard-welcome"]',
    titleKey: "tour.dashboard.title",
    descriptionKey: "tour.dashboard.desc",
    placement: "bottom",
  },
  {
    target: '[data-tour="dashboard-metrics"]',
    titleKey: "tour.metrics.title",
    descriptionKey: "tour.metrics.desc",
    placement: "bottom",
  },
  {
    target: '[data-tour="lang-switcher"]',
    titleKey: "tour.language.title",
    descriptionKey: "tour.language.desc",
    placement: "bottom",
  },
  {
    target: '[data-tour="nav-settings"]',
    titleKey: "tour.settings.title",
    descriptionKey: "tour.settings.desc",
    placement: "right",
  },
  {
    target: "",
    titleKey: "tour.complete.title",
    descriptionKey: "tour.complete.desc",
    placement: "bottom",
    center: true,
  },
];
