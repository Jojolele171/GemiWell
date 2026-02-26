
export type Report = {
  id: string;
  name: string;
  date: string;
  summary: string;
  confidence: number;
};

export const mockReports: Report[] = [
  {
    id: 'REP001',
    name: 'Annual Physical Exam',
    date: '2023-10-15',
    summary:
      'Patient shows good overall health. Minor vitamin D deficiency noted. Recommended supplements and more sun exposure.',
    confidence: 0.95,
  },
  {
    id: 'REP002',
    name: 'Blood Test Results',
    date: '2023-09-22',
    summary:
      'Cholesterol levels are slightly elevated. LDL is 135 mg/dL. Recommended dietary changes and follow-up in 3 months.',
    confidence: 0.98,
  },
  {
    id: 'REP003',
    name: 'X-Ray Left Knee',
    date: '2023-08-01',
    summary:
      'No fractures or dislocations observed. Mild signs of osteoarthritis are present. Physical therapy is advised.',
    confidence: 0.92,
  },
];

export type FoodLog = {
  id: string;
  name: string;
  calories: number;
  time: string;
};

export const mockFoodLog: FoodLog[] = [
  { id: 'FOOD01', name: 'Oatmeal with berries', calories: 350, time: '8:00 AM' },
  { id: 'FOOD02', name: 'Grilled Chicken Salad', calories: 450, time: '1:00 PM' },
  { id: 'FOOD03', name: 'Apple with peanut butter', calories: 250, time: '4:00 PM' },
  { id: 'FOOD04', name: 'Salmon with Quinoa', calories: 600, time: '7:00 PM' },
];

export type Patient = {
  id: string;
  name: string;
  lastActivity: string;
};

export const mockPatients: Patient[] = [
  { id: 'PAT01', name: 'John Doe', lastActivity: '3 hours ago' },
  { id: 'PAT02', name: 'Jane Smith', lastActivity: '1 day ago' },
  { id: 'PAT03', name: 'Peter Jones', lastActivity: '2 days ago' },
  { id: 'PAT04', name: 'Mary Williams', lastActivity: '5 days ago' },
];

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export type UserCategory = 'doctor' | 'patient' | 'normal';

export type HealthProfile = {
  conditions: string;
  habits: string;
  diet: string;
  height: string;
  weight: string;
  age: string;
  userCategory: UserCategory;
  hospital?: string;
  badgeNumber?: string;
}
