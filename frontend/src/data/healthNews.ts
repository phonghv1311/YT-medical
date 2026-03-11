export type ArticleCategory = 'NUTRITION' | 'MENTAL HEALTH' | 'PREVENTION' | 'LIFESTYLE' | 'HEALTH TIPS' | 'ALL';

export interface HealthNewsItem {
  id: string;
  title: string;
  date: string;
  read: string;
  img: string;
  content: string[];
  category?: ArticleCategory;
  authorName?: string;
  authorSpecialty?: string;
  updated?: string;
  highlightTitle?: string;
  highlightItems?: string[];
}

export const HEALTH_NEWS_ITEMS: HealthNewsItem[] = [
  {
    id: 'immune-foods',
    title: '10 Foods to Boost Your Immune System',
    date: 'Oct 24, 2023',
    read: '5 min read',
    img: 'bg-green-100',
    category: 'NUTRITION',
    authorName: 'Dr. Sarah Jenkins',
    authorSpecialty: 'Infectious Disease Specialist',
    updated: '2 days ago',
    content: [
      'A strong immune system helps your body fight off infections and stay healthy. While no single food can guarantee immunity, a balanced diet rich in certain nutrients can support your immune function.',
      'Citrus fruits like oranges and grapefruits are high in vitamin C, which is known to increase white blood cell production. Red bell peppers contain even more vitamin C than most citrus, plus beta carotene.',
      'Broccoli is packed with vitamins A, C, and E, along with fiber and antioxidants. Spinach and other leafy greens provide folate, which helps repair DNA and produce new cells.',
      'Yogurt with live cultures can stimulate your immune system. Look for labels that say "live and active cultures." Almonds and sunflower seeds offer vitamin E, which is key to a healthy immune system.',
      'Turmeric has been used for years as an anti-inflammatory. Green tea is rich in flavonoids and a small amount of amino acid that may aid in the production of immune cells.',
      'Including a variety of these foods in your meals, along with regular sleep and exercise, can help keep your immune system in good shape.',
    ],
  },
  {
    id: 'mental-health-tips',
    title: 'Mental Health Tips',
    date: 'Oct 22, 2023',
    read: '4 min read',
    img: 'bg-blue-100',
    category: 'MENTAL HEALTH',
    content: [
      'Taking care of your mental health is as important as caring for your physical health. Small daily habits can make a big difference in how you feel and function.',
      'Stay connected with people you trust. Even a short conversation can reduce stress and remind you that you are not alone. Schedule regular catch-ups with friends or family.',
      'Move your body. Physical activity releases endorphins and can improve mood and sleep. You don’t need a gym—a walk, stretch, or dance at home counts.',
      'Set boundaries with work and screen time. Constant notifications can increase anxiety. Designate times when you put devices away and focus on rest or hobbies.',
      'Practice simple relaxation techniques: deep breathing, mindfulness, or listening to calming music. If you feel overwhelmed, consider talking to a professional—seeking help is a sign of strength.',
    ],
  },
  {
    id: 'sleep-better',
    title: 'How to Sleep Better Tonight',
    date: 'Oct 20, 2023',
    read: '4 min read',
    img: 'bg-indigo-100',
    category: 'PREVENTION',
    content: [
      'Good sleep improves mood, focus, and overall health. If you struggle to fall or stay asleep, these evidence-based tips can help.',
      'Keep a consistent schedule. Going to bed and waking up at roughly the same time every day—even on weekends—trains your body to feel tired and alert at the right times.',
      'Create a dark, quiet, and cool environment. Use blackout curtains or an eye mask, reduce noise with earplugs or white noise, and set the room to a comfortable temperature.',
      'Limit screens before bed. The blue light from phones and tablets can interfere with melatonin. Try to put devices away at least an hour before sleep.',
      'Avoid large meals, caffeine, and alcohol close to bedtime. If you wake at night, get up and do something calm until you feel sleepy again, rather than lying in bed frustrated.',
    ],
  },
  {
    id: 'hydration-health',
    title: 'Why Hydration Matters for Your Health',
    date: 'Oct 18, 2023',
    read: '3 min read',
    img: 'bg-cyan-100',
    category: 'LIFESTYLE',
    content: [
      'Water is essential for almost every function in your body: regulating temperature, transporting nutrients, and removing waste. Even mild dehydration can affect energy and concentration.',
      'Aim for about 8 glasses of fluid a day, but needs vary with activity, climate, and health. Thirst is one signal; the color of your urine is another—pale yellow usually means you’re well hydrated.',
      'Start the day with a glass of water and keep a bottle nearby. Eating water-rich foods like cucumbers, oranges, and watermelon also contributes to your daily intake.',
      'If you find plain water boring, add slices of lemon, mint, or cucumber. Herbal teas and diluted fruit juice can count toward your fluid goal, but watch added sugars.',
    ],
  },
  {
    id: 'stress-management',
    title: 'Simple Stress Management Techniques',
    date: 'Oct 15, 2023',
    read: '5 min read',
    img: 'bg-amber-100',
    category: 'MENTAL HEALTH',
    content: [
      'Stress is a normal part of life, but chronic stress can harm your health. These simple techniques can help you feel more calm and in control.',
      'Breathing exercises are one of the fastest ways to calm the nervous system. Try inhaling for 4 counts, holding for 4, and exhaling for 6. Repeat a few times.',
      'Break tasks into smaller steps. When everything feels urgent, list what truly needs to be done today and tackle one item at a time. Crossing items off can reduce overwhelm.',
      'Stay active. Exercise is a proven stress reliever. Even a 10-minute walk can improve mood and clear your head.',
      'Know when to ask for help. Talking to a friend, family member, or professional can provide support and new perspectives. You don’t have to manage everything alone.',
    ],
  },
  {
    id: 'preventing-seasonal-flu',
    title: 'Preventing Seasonal Flu',
    date: 'Oct 10, 2023',
    read: '5 min read',
    img: 'bg-sky-100',
    category: 'HEALTH TIPS',
    authorName: 'Dr. Sarah Jenkins',
    authorSpecialty: 'Infectious Disease Specialist',
    updated: '2 days ago',
    highlightTitle: 'Preventative Measures',
    highlightItems: [
      'Get your annual flu vaccine as early as possible in the season.',
      'Wash your hands often with soap and water for at least 20 seconds.',
      'Avoid close contact with people who are sick.',
      'Cover your mouth and nose with a tissue when coughing or sneezing.',
    ],
    content: [
      'The risk of seasonal flu increases in colder months. Influenza spreads through respiratory droplets when an infected person coughs, sneezes, or talks.',
      'These measures are not a replacement for professional medical advice. If you suspect you have the flu, consult with a doctor immediately through our telemedicine platform.',
    ],
  },
];
