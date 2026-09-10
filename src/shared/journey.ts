export type JourneyStage = {
  id: string;
  number: string;
  title: string;
  reading: string;
  prompt: string;
  minutes: number;
};

export type JourneyResource = {
  id: string;
  title: string;
  url: string;
};

export type JourneyFinalPage = {
  label: string;
  pendingTitle: string;
  pendingDescription: string;
  completedTitle: string;
  completedDescription: string;
};

export type Journey = {
  label: string;
  title: string;
  subtitle: string;
  description: string;
  resources: JourneyResource[];
  finalPage: JourneyFinalPage;
  stages: JourneyStage[];
};

export const MAX_JOURNEY_RESOURCES = 8;
export const MAX_JOURNEY_STAGES = 12;

export const starterJourney: Journey = {
  label: 'Starter journey',
  title: 'Learn together',
  subtitle:
    'A guided group journey for an article, video, podcast, course, book, or study resource.',
  description:
    'Choose a resource together. Explore each session at your own pace, then return to the discussion with one thing worth sharing.',
  resources: [],
  finalPage: {
    label: 'The closing reflection',
    pendingTitle: 'A shared ending awaits.',
    pendingDescription:
      'Complete every session to reveal the closing reflection.',
    completedTitle: 'You made it.',
    completedDescription:
      'Take one insight back to the Reddit discussion. Look for what another participant noticed that you missed.',
  },
  stages: [
    {
      id: 'arrive',
      number: '01',
      title: 'Arrive curious',
      reading: 'Explore the title, introduction, and opening section.',
      prompt: 'What question do you hope this resource will answer?',
      minutes: 12,
    },
    {
      id: 'notice',
      number: '02',
      title: 'Notice the pattern',
      reading: 'Continue through the next section. Note one repeated idea.',
      prompt: 'Which image, example, phrase, or argument keeps returning?',
      minutes: 15,
    },
    {
      id: 'turn',
      number: '03',
      title: 'Find the turn',
      reading:
        'Continue to the central change, tension, demonstration, or claim.',
      prompt: 'Where does the material ask you to see something differently?',
      minutes: 18,
    },
    {
      id: 'connect',
      number: '04',
      title: 'Make a connection',
      reading: 'Finish the remaining material and revisit your notes.',
      prompt:
        'What does this connect to in life, another resource, or your community?',
      minutes: 15,
    },
    {
      id: 'share',
      number: '05',
      title: 'Carry it forward',
      reading: 'Review the part that mattered most to you.',
      prompt: 'What is one insight you want the community to remember?',
      minutes: 10,
    },
  ],
};
