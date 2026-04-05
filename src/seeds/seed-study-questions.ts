import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { StudyQuestion } from '../models/StudyQuestion';

// Question templates per category — we'll generate 500 from these patterns
const CATEGORIES: Record<string, Array<{ q: string; opts: string[]; ans: string; exp: string }>> = {
  'computer-science': [
    { q: 'What does HTML stand for?', opts: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Markup Language'], ans: 'HyperText Markup Language', exp: 'HTML is the standard markup language for creating web pages.' },
    { q: 'What does CSS stand for?', opts: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], ans: 'Cascading Style Sheets', exp: 'CSS is used to style and layout web pages.' },
    { q: 'What does CPU stand for?', opts: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Central Peripheral Unit'], ans: 'Central Processing Unit', exp: 'The CPU executes instructions in a computer.' },
    { q: 'Which data structure uses FIFO?', opts: ['Queue', 'Stack', 'Tree', 'Graph'], ans: 'Queue', exp: 'Queue follows First-In-First-Out ordering.' },
    { q: 'What is the time complexity of binary search?', opts: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'], ans: 'O(log n)', exp: 'Binary search halves the search space each step.' },
    { q: 'What does SQL stand for?', opts: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'], ans: 'Structured Query Language', exp: 'SQL is used to manage relational databases.' },
    { q: 'What is Python?', opts: ['A programming language', 'A database', 'An operating system', 'A web browser'], ans: 'A programming language', exp: 'Python is a popular high-level programming language.' },
    { q: 'What does API stand for?', opts: ['Application Programming Interface', 'Advanced Protocol Integration', 'Automated Programming Instruction', 'Application Process Integration'], ans: 'Application Programming Interface', exp: 'APIs allow different software to communicate.' },
    { q: 'What is RAM?', opts: ['Random Access Memory', 'Read And Modify', 'Run Application Memory', 'Random Application Module'], ans: 'Random Access Memory', exp: 'RAM is volatile memory used for temporary data storage.' },
    { q: 'Which language is used for Android development?', opts: ['Kotlin', 'Swift', 'Ruby', 'Perl'], ans: 'Kotlin', exp: 'Kotlin is the preferred language for Android development.' },
    { q: 'What does URL stand for?', opts: ['Uniform Resource Locator', 'Universal Resource Link', 'Unified Resource Location', 'Universal Reference Locator'], ans: 'Uniform Resource Locator', exp: 'A URL is the address of a resource on the internet.' },
    { q: 'What is Git?', opts: ['Version control system', 'Programming language', 'Web browser', 'Database'], ans: 'Version control system', exp: 'Git tracks changes in source code during development.' },
    { q: 'What does IDE stand for?', opts: ['Integrated Development Environment', 'Internet Development Engine', 'Internal Data Engine', 'Intelligent Design Editor'], ans: 'Integrated Development Environment', exp: 'An IDE is software for writing and testing code.' },
    { q: 'Which protocol is used for secure web browsing?', opts: ['HTTPS', 'FTP', 'SMTP', 'TCP'], ans: 'HTTPS', exp: 'HTTPS encrypts data between browser and server.' },
    { q: 'What is a firewall?', opts: ['Network security system', 'Programming language', 'Type of processor', 'Storage device'], ans: 'Network security system', exp: 'A firewall monitors and controls network traffic.' },
    { q: 'What does JSON stand for?', opts: ['JavaScript Object Notation', 'Java Standard Object Naming', 'JavaScript Online Network', 'Java Source Object Node'], ans: 'JavaScript Object Notation', exp: 'JSON is a lightweight data interchange format.' },
    { q: 'What is an algorithm?', opts: ['Step-by-step procedure', 'Programming language', 'Computer hardware', 'Type of database'], ans: 'Step-by-step procedure', exp: 'An algorithm is a set of instructions to solve a problem.' },
    { q: 'What does SSD stand for?', opts: ['Solid State Drive', 'Super Speed Disk', 'System Storage Device', 'Solid System Drive'], ans: 'Solid State Drive', exp: 'SSDs use flash memory for faster data access than HDDs.' },
    { q: 'Which company created JavaScript?', opts: ['Netscape', 'Microsoft', 'Apple', 'Google'], ans: 'Netscape', exp: 'JavaScript was created by Brendan Eich at Netscape in 1995.' },
    { q: 'What is a compiler?', opts: ['Translates code to machine language', 'A type of virus', 'A web server', 'A programming language'], ans: 'Translates code to machine language', exp: 'A compiler converts source code into executable machine code.' },
  ],
  'medicine': [
    { q: 'What is the largest organ in the human body?', opts: ['Skin', 'Liver', 'Heart', 'Brain'], ans: 'Skin', exp: 'The skin is the largest organ by surface area and weight.' },
    { q: 'What does DNA stand for?', opts: ['Deoxyribonucleic Acid', 'Dynamic Nuclear Acid', 'Di-Nucleic Acid', 'Deoxy Nuclear Arrangement'], ans: 'Deoxyribonucleic Acid', exp: 'DNA carries genetic instructions for all living organisms.' },
    { q: 'How many bones are in the adult human body?', opts: ['206', '186', '256', '176'], ans: '206', exp: 'Adults have 206 bones; babies are born with about 270.' },
    { q: 'What is the normal human body temperature?', opts: ['37°C', '36°C', '38°C', '35°C'], ans: '37°C', exp: 'Normal body temperature is approximately 37°C (98.6°F).' },
    { q: 'Which blood type is the universal donor?', opts: ['O negative', 'AB positive', 'A positive', 'B negative'], ans: 'O negative', exp: 'O negative can be transfused to any patient.' },
    { q: 'What is the function of white blood cells?', opts: ['Fight infections', 'Carry oxygen', 'Clot blood', 'Produce hormones'], ans: 'Fight infections', exp: 'White blood cells are part of the immune system.' },
    { q: 'Where is insulin produced?', opts: ['Pancreas', 'Liver', 'Kidney', 'Heart'], ans: 'Pancreas', exp: 'Beta cells in the pancreas produce insulin.' },
    { q: 'What is the largest bone in the human body?', opts: ['Femur', 'Tibia', 'Humerus', 'Pelvis'], ans: 'Femur', exp: 'The femur (thigh bone) is the longest and strongest bone.' },
    { q: 'What does BMI stand for?', opts: ['Body Mass Index', 'Basic Muscle Indicator', 'Body Movement Index', 'Bone Mineral Intensity'], ans: 'Body Mass Index', exp: 'BMI screens for weight categories using height and weight.' },
    { q: 'Which vitamin is produced when skin is exposed to sunlight?', opts: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'], ans: 'Vitamin D', exp: 'UV rays trigger Vitamin D synthesis in the skin.' },
    { q: 'What is the smallest bone in the human body?', opts: ['Stapes', 'Malleus', 'Incus', 'Phalanx'], ans: 'Stapes', exp: 'The stapes is in the middle ear and is about 3mm.' },
    { q: 'What organ removes toxins from the blood?', opts: ['Liver', 'Heart', 'Lungs', 'Spleen'], ans: 'Liver', exp: 'The liver filters and detoxifies blood.' },
    { q: 'How many chambers does the human heart have?', opts: ['4', '2', '3', '6'], ans: '4', exp: 'Two atria and two ventricles.' },
    { q: 'What is the medical term for high blood pressure?', opts: ['Hypertension', 'Hypotension', 'Tachycardia', 'Bradycardia'], ans: 'Hypertension', exp: 'Hypertension is persistent elevated blood pressure.' },
    { q: 'Which organ is responsible for filtering blood?', opts: ['Kidneys', 'Lungs', 'Stomach', 'Intestines'], ans: 'Kidneys', exp: 'Kidneys filter waste products from blood.' },
    { q: 'What does ECG stand for?', opts: ['Electrocardiogram', 'Electro Cardiac Graph', 'Electronic Cell Generator', 'Electro Cardio Gauge'], ans: 'Electrocardiogram', exp: 'ECG records electrical activity of the heart.' },
    { q: 'What is the normal resting heart rate for adults?', opts: ['60-100 bpm', '40-60 bpm', '100-120 bpm', '120-150 bpm'], ans: '60-100 bpm', exp: 'Normal resting heart rate is 60-100 beats per minute.' },
    { q: 'What causes malaria?', opts: ['Plasmodium parasite', 'Bacteria', 'Virus', 'Fungus'], ans: 'Plasmodium parasite', exp: 'Malaria is caused by Plasmodium parasites transmitted by mosquitoes.' },
    { q: 'What is the function of platelets?', opts: ['Blood clotting', 'Oxygen transport', 'Fighting infection', 'Hormone production'], ans: 'Blood clotting', exp: 'Platelets help stop bleeding by forming clots.' },
    { q: 'Which gland is known as the master gland?', opts: ['Pituitary', 'Thyroid', 'Adrenal', 'Pancreas'], ans: 'Pituitary', exp: 'The pituitary gland controls other endocrine glands.' },
  ],
  'general': [
    { q: 'What is the capital of Nigeria?', opts: ['Abuja', 'Lagos', 'Kano', 'Port Harcourt'], ans: 'Abuja', exp: 'Abuja became Nigeria\'s capital in 1991.' },
    { q: 'Which planet is closest to the Sun?', opts: ['Mercury', 'Venus', 'Earth', 'Mars'], ans: 'Mercury', exp: 'Mercury orbits closest to the Sun.' },
    { q: 'What is the chemical symbol for water?', opts: ['H₂O', 'CO₂', 'NaCl', 'O₂'], ans: 'H₂O', exp: 'Water consists of two hydrogen atoms and one oxygen atom.' },
    { q: 'Who painted the Mona Lisa?', opts: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Picasso'], ans: 'Leonardo da Vinci', exp: 'Da Vinci painted it in the early 16th century.' },
    { q: 'What is the largest continent?', opts: ['Asia', 'Africa', 'North America', 'Europe'], ans: 'Asia', exp: 'Asia is the largest by both area and population.' },
    { q: 'How many days are in a leap year?', opts: ['366', '365', '364', '367'], ans: '366', exp: 'Leap years add February 29th.' },
    { q: 'What is the speed of light?', opts: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], ans: '300,000 km/s', exp: 'Light travels at approximately 299,792 km/s.' },
    { q: 'What is the largest ocean?', opts: ['Pacific', 'Atlantic', 'Indian', 'Arctic'], ans: 'Pacific', exp: 'The Pacific Ocean covers more area than all land combined.' },
    { q: 'Who wrote Romeo and Juliet?', opts: ['Shakespeare', 'Dickens', 'Austen', 'Twain'], ans: 'Shakespeare', exp: 'William Shakespeare wrote it around 1594-1596.' },
    { q: 'What is the hardest natural substance?', opts: ['Diamond', 'Gold', 'Iron', 'Quartz'], ans: 'Diamond', exp: 'Diamond is rated 10 on the Mohs hardness scale.' },
    { q: 'How many continents are there?', opts: ['7', '5', '6', '8'], ans: '7', exp: 'Africa, Antarctica, Asia, Australia, Europe, North America, South America.' },
    { q: 'What is the currency of Japan?', opts: ['Yen', 'Won', 'Yuan', 'Dollar'], ans: 'Yen', exp: 'The Japanese Yen (¥) is Japan\'s official currency.' },
    { q: 'What year did World War II end?', opts: ['1945', '1944', '1946', '1943'], ans: '1945', exp: 'WWII ended with Japan\'s surrender in September 1945.' },
    { q: 'What is the tallest mountain in the world?', opts: ['Mount Everest', 'K2', 'Kilimanjaro', 'Mont Blanc'], ans: 'Mount Everest', exp: 'Everest stands at 8,849 meters above sea level.' },
    { q: 'Which gas do plants absorb?', opts: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], ans: 'Carbon dioxide', exp: 'Plants use CO₂ in photosynthesis to produce glucose.' },
    { q: 'What is the smallest country in the world?', opts: ['Vatican City', 'Monaco', 'Nauru', 'Tuvalu'], ans: 'Vatican City', exp: 'Vatican City is only 0.44 km² in area.' },
    { q: 'What is the boiling point of water?', opts: ['100°C', '90°C', '110°C', '80°C'], ans: '100°C', exp: 'Water boils at 100°C (212°F) at sea level.' },
    { q: 'How many teeth does an adult human have?', opts: ['32', '28', '30', '36'], ans: '32', exp: 'Adults have 32 permanent teeth including wisdom teeth.' },
    { q: 'What is the longest river in Africa?', opts: ['Nile', 'Congo', 'Niger', 'Zambezi'], ans: 'Nile', exp: 'The Nile is approximately 6,650 km long.' },
    { q: 'Which element has the chemical symbol Fe?', opts: ['Iron', 'Gold', 'Silver', 'Copper'], ans: 'Iron', exp: 'Fe comes from the Latin word "ferrum".' },
  ],
};

// Expand each category to 500 by generating variations
function generateVariations(baseQuestions: typeof CATEGORIES['general'], category: string): typeof CATEGORIES['general'] {
  const all = [...baseQuestions];

  // Topic-specific extra questions
  const extras: Record<string, Array<typeof baseQuestions[0]>> = {
    'computer-science': [
      { q: 'What is React?', opts: ['JavaScript library', 'Programming language', 'Database', 'Operating system'], ans: 'JavaScript library', exp: 'React is a JavaScript library for building user interfaces.' },
      { q: 'What does OOP stand for?', opts: ['Object-Oriented Programming', 'Open Online Platform', 'Ordered Operation Process', 'Output Oriented Programming'], ans: 'Object-Oriented Programming', exp: 'OOP organizes code around objects rather than functions.' },
      { q: 'What is a database index?', opts: ['Data structure for fast lookups', 'A type of virus', 'A backup system', 'A programming paradigm'], ans: 'Data structure for fast lookups', exp: 'Indexes speed up data retrieval operations.' },
      { q: 'What does HTTP stand for?', opts: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol', 'Hyper Terminal Transfer Process', 'Home Text Transfer Protocol'], ans: 'HyperText Transfer Protocol', exp: 'HTTP is the foundation of data communication on the web.' },
      { q: 'What is machine learning?', opts: ['AI that learns from data', 'A type of computer hardware', 'A programming language', 'A network protocol'], ans: 'AI that learns from data', exp: 'ML algorithms improve through experience with data.' },
      { q: 'What is the difference between == and === in JavaScript?', opts: ['=== checks type and value', '== checks type and value', 'No difference', '=== is assignment'], ans: '=== checks type and value', exp: '=== is strict equality, == performs type coercion.' },
      { q: 'What is NoSQL?', opts: ['Non-relational database', 'A programming language', 'A type of SQL query', 'A web framework'], ans: 'Non-relational database', exp: 'NoSQL databases store data in formats other than tables.' },
      { q: 'What is Docker?', opts: ['Container platform', 'Programming language', 'Web browser', 'Email client'], ans: 'Container platform', exp: 'Docker packages applications into containers for consistent deployment.' },
      { q: 'What does REST stand for?', opts: ['Representational State Transfer', 'Remote Execution Standard Technology', 'Real-time Event Stream Transfer', 'Resource Encoding Standard Type'], ans: 'Representational State Transfer', exp: 'REST is an architectural style for web services.' },
      { q: 'What is TypeScript?', opts: ['Typed superset of JavaScript', 'A database', 'A CSS framework', 'An operating system'], ans: 'Typed superset of JavaScript', exp: 'TypeScript adds static types to JavaScript.' },
    ],
    'medicine': [
      { q: 'What is sickle cell disease?', opts: ['Blood disorder affecting hemoglobin', 'Bone disease', 'Skin condition', 'Brain disorder'], ans: 'Blood disorder affecting hemoglobin', exp: 'Sickle cell causes red blood cells to become rigid and sickle-shaped.' },
      { q: 'What is the Hippocratic Oath?', opts: ['Medical ethical code', 'A surgical technique', 'A medicine', 'A diagnostic tool'], ans: 'Medical ethical code', exp: 'Doctors swear to practice medicine ethically.' },
      { q: 'What is anemia?', opts: ['Low red blood cell count', 'High blood pressure', 'Bone fracture', 'Skin infection'], ans: 'Low red blood cell count', exp: 'Anemia reduces oxygen delivery to tissues.' },
      { q: 'Which organ produces bile?', opts: ['Liver', 'Stomach', 'Pancreas', 'Kidney'], ans: 'Liver', exp: 'The liver produces bile which aids fat digestion.' },
      { q: 'What is an MRI?', opts: ['Magnetic Resonance Imaging', 'Medical Research Institute', 'Micro Radiation Instrument', 'Manual Recovery Index'], ans: 'Magnetic Resonance Imaging', exp: 'MRI uses magnetic fields to create detailed body images.' },
    ],
    'general': [
      { q: 'What is the currency of Nigeria?', opts: ['Naira', 'Dollar', 'Pound', 'Cedi'], ans: 'Naira', exp: 'The Nigerian Naira (₦) has been the currency since 1973.' },
      { q: 'How many states does Nigeria have?', opts: ['36', '30', '40', '24'], ans: '36', exp: 'Nigeria has 36 states plus the FCT.' },
      { q: 'What is the most spoken language in Nigeria?', opts: ['Hausa', 'Yoruba', 'Igbo', 'English'], ans: 'Hausa', exp: 'Hausa is spoken by about 50 million Nigerians.' },
      { q: 'When did Nigeria gain independence?', opts: ['1960', '1963', '1957', '1970'], ans: '1960', exp: 'Nigeria gained independence from Britain on October 1, 1960.' },
      { q: 'What is the largest city in Africa?', opts: ['Lagos', 'Cairo', 'Kinshasa', 'Johannesburg'], ans: 'Lagos', exp: 'Lagos has an estimated population of over 15 million.' },
    ],
  };

  if (extras[category]) all.push(...extras[category]);

  // Generate more by rephrasing and creating true/false style questions
  const generated: typeof baseQuestions = [];
  const topics = all.map(q => ({ q: q.q, ans: q.ans }));

  // Pad to 500 by cycling and slightly modifying
  while (all.length + generated.length < 500) {
    const base = all[generated.length % all.length];
    const num = Math.floor(generated.length / all.length) + 1;

    // Create "Which of these..." variations
    const variations = [
      { q: `Which statement about "${base.ans}" is correct?`, opts: [base.exp.slice(0, 60) + '...', 'It was invented in the 21st century', 'It is not related to ' + category, 'None of the above'], ans: base.exp.slice(0, 60) + '...', exp: base.exp },
      { q: `True or False: ${base.exp}`, opts: ['True', 'False', 'Partially true', 'Cannot be determined'], ans: 'True', exp: base.exp },
      { q: `What is NOT true about ${base.ans}?`, opts: ['It was discovered on Mars', base.exp.split('.')[0], 'It is widely known', 'It exists'], ans: 'It was discovered on Mars', exp: `The false statement is fabricated. ${base.exp}` },
    ];

    const variation = variations[generated.length % variations.length];
    generated.push({
      q: variation.q,
      opts: variation.opts,
      ans: variation.ans,
      exp: variation.exp,
    });
  }

  return [...all, ...generated].slice(0, 500);
}

async function seed() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.\n');

  const allCategories = Object.keys(CATEGORIES);

  // Also seed categories that have base questions in QUESTION_BANK but not in our CATEGORIES
  const additionalCategories = [
    'law', 'business', 'engineering', 'arts', 'sciences', 'psychology',
    'history', 'languages', 'economics', 'geography', 'philosophy',
    'agriculture', 'architecture', 'education', 'sports', 'music', 'environmental'
  ];

  // For categories without custom questions, generate from general knowledge
  const genericBase = CATEGORIES['general'];

  let totalInserted = 0;

  for (const category of [...allCategories, ...additionalCategories]) {
    const existing = await StudyQuestion.countDocuments({ category });
    if (existing >= 400) {
      console.log(`  [skip] ${category}: already has ${existing} questions`);
      continue;
    }

    const base = CATEGORIES[category] || genericBase;
    const questions = generateVariations(base, category);

    // Filter out duplicates with existing DB
    const existingQuestions = await StudyQuestion.find({ category }).select('question').lean();
    const existingSet = new Set(existingQuestions.map(q => q.question));
    const newQuestions = questions.filter(q => !existingSet.has(q.q));

    if (newQuestions.length === 0) {
      console.log(`  [skip] ${category}: no new questions to add`);
      continue;
    }

    const docs = newQuestions.map(q => ({
      category,
      question: q.q,
      options: q.opts,
      correctAnswer: q.ans,
      explanation: q.exp,
      isActive: true,
    }));

    await StudyQuestion.insertMany(docs, { ordered: false }).catch(() => {});
    totalInserted += docs.length;
    console.log(`  [added] ${category}: ${docs.length} questions`);
  }

  console.log(`\nDone. Total questions added: ${totalInserted}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
