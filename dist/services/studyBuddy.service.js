"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/studyBuddy.service.ts
const StudyBuddy_1 = require("../models/StudyBuddy");
const User_1 = require("../models/User");
const points_service_1 = __importDefault(require("./points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
// Points config for study sessions
const STUDY_POINTS = {
    soloCompletion: 5, // Base points for finishing a solo session
    perfectScore: 15, // Bonus for 100% correct
    challengeWin: 20, // Winner of a challenge
    challengeLoser: 5, // Consolation for challenger who lost
    perCorrectAnswer: 1, // Per correct answer
};
const CATEGORY_KEYWORDS = {
    'computer-science': ['software', 'developer', 'programmer', 'tech', 'it', 'coding', 'cs', 'computer', 'data', 'cyber'],
    'medicine': ['doctor', 'nurse', 'medical', 'health', 'pharmacy', 'clinical', 'surgeon', 'dentist', 'therapist'],
    'law': ['lawyer', 'attorney', 'legal', 'law', 'paralegal', 'judge', 'barrister'],
    'business': ['business', 'finance', 'accounting', 'marketing', 'mba', 'economics', 'management', 'entrepreneur'],
    'engineering': ['engineer', 'mechanical', 'civil', 'electrical', 'chemical', 'aerospace'],
    'arts': ['art', 'design', 'music', 'film', 'photography', 'creative', 'writer', 'journalist', 'media'],
    'sciences': ['biology', 'chemistry', 'physics', 'math', 'science', 'research', 'lab', 'geology'],
    'psychology': ['psychology', 'counselor', 'therapist', 'mental', 'behavioral', 'psychiatry'],
    'history': ['history', 'historian', 'archaeology', 'anthropology', 'political', 'social'],
    'languages': ['language', 'english', 'french', 'spanish', 'linguistics', 'literature', 'translation'],
    'economics': ['economics', 'economist', 'macro', 'micro', 'trade', 'fiscal', 'monetary'],
    'geography': ['geography', 'geographer', 'cartography', 'climate', 'environment', 'urban'],
    'philosophy': ['philosophy', 'ethics', 'logic', 'metaphysics', 'critical thinking'],
    'agriculture': ['agriculture', 'farming', 'agronomy', 'veterinary', 'crop', 'livestock', 'food science'],
    'architecture': ['architecture', 'architect', 'urban planning', 'building', 'interior design'],
    'education': ['education', 'teacher', 'teaching', 'pedagogy', 'curriculum', 'instructor'],
    'sports': ['sports', 'athlete', 'fitness', 'coaching', 'kinesiology', 'physical education'],
    'music': ['music', 'musician', 'composer', 'producer', 'audio', 'sound'],
    'environmental': ['environmental', 'ecology', 'sustainability', 'conservation', 'climate', 'renewable'],
    'general': ['student', 'general', 'education', 'school', 'university', 'college', 'learning'],
};
const CATEGORIES = [
    { key: 'computer-science', label: 'Computer Science', icon: 'laptop-code' },
    { key: 'medicine', label: 'Medicine & Health', icon: 'heartbeat' },
    { key: 'law', label: 'Law & Legal', icon: 'gavel' },
    { key: 'business', label: 'Business & Finance', icon: 'briefcase' },
    { key: 'engineering', label: 'Engineering', icon: 'cogs' },
    { key: 'arts', label: 'Arts & Humanities', icon: 'palette' },
    { key: 'sciences', label: 'Sciences', icon: 'flask' },
    { key: 'psychology', label: 'Psychology', icon: 'brain' },
    { key: 'history', label: 'History & Politics', icon: 'hourglass' },
    { key: 'languages', label: 'Languages & Literature', icon: 'language' },
    { key: 'economics', label: 'Economics', icon: 'stats-chart' },
    { key: 'geography', label: 'Geography', icon: 'globe' },
    { key: 'philosophy', label: 'Philosophy', icon: 'bulb' },
    { key: 'agriculture', label: 'Agriculture', icon: 'leaf' },
    { key: 'architecture', label: 'Architecture', icon: 'business' },
    { key: 'education', label: 'Education', icon: 'school' },
    { key: 'sports', label: 'Sports Science', icon: 'fitness' },
    { key: 'music', label: 'Music', icon: 'musical-notes' },
    { key: 'environmental', label: 'Environmental', icon: 'earth' },
    { key: 'general', label: 'General Knowledge', icon: 'book' },
];
const QUESTION_BANK = {
    'computer-science': [
        { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Central Peripheral Unit'], correctAnswer: 'Central Processing Unit', explanation: 'CPU stands for Central Processing Unit, the primary component that executes instructions.' },
        { question: 'Which data structure uses FIFO ordering?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswer: 'Queue', explanation: 'A Queue follows First-In-First-Out (FIFO) ordering.' },
        { question: 'What is the time complexity of binary search?', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], correctAnswer: 'O(log n)', explanation: 'Binary search halves the search space each step, giving O(log n) complexity.' },
        { question: 'Which programming language is known as the "language of the web"?', options: ['JavaScript', 'Python', 'Java', 'C++'], correctAnswer: 'JavaScript', explanation: 'JavaScript is the primary language used for web development in browsers.' },
        { question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Language'], correctAnswer: 'Structured Query Language', explanation: 'SQL stands for Structured Query Language, used for managing relational databases.' },
        { question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Merge Sort', 'Bubble Sort', 'Selection Sort', 'Insertion Sort'], correctAnswer: 'Merge Sort', explanation: 'Merge Sort has O(n log n) average-case complexity, better than O(n^2) algorithms.' },
        { question: 'What is the purpose of an API?', options: ['To allow software components to communicate', 'To store data in a database', 'To design user interfaces', 'To compile source code'], correctAnswer: 'To allow software components to communicate', explanation: 'An API (Application Programming Interface) enables communication between software components.' },
        { question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High-Level Text Machine Language', 'HyperText Machine Logic', 'Home Tool Markup Language'], correctAnswer: 'HyperText Markup Language', explanation: 'HTML stands for HyperText Markup Language, the standard markup language for web pages.' },
        { question: 'Which of these is a NoSQL database?', options: ['MongoDB', 'MySQL', 'PostgreSQL', 'Oracle'], correctAnswer: 'MongoDB', explanation: 'MongoDB is a document-oriented NoSQL database, while the others are relational (SQL) databases.' },
        { question: 'What is recursion?', options: ['A function that calls itself', 'A loop that runs forever', 'A type of variable', 'A sorting algorithm'], correctAnswer: 'A function that calls itself', explanation: 'Recursion is when a function calls itself to solve smaller instances of the same problem.' },
        { question: 'What does OOP stand for?', options: ['Object-Oriented Programming', 'Open Online Platform', 'Operational Output Processing', 'Organized Object Protocol'], correctAnswer: 'Object-Oriented Programming', explanation: 'OOP is a programming paradigm based on objects containing data and methods.' },
        { question: 'Which protocol is used for secure web browsing?', options: ['HTTPS', 'HTTP', 'FTP', 'SMTP'], correctAnswer: 'HTTPS', explanation: 'HTTPS (HTTP Secure) encrypts data between the browser and server using TLS/SSL.' },
        { question: 'What is a primary key in a database?', options: ['A unique identifier for each record', 'The first column in a table', 'A password for the database', 'A foreign reference'], correctAnswer: 'A unique identifier for each record', explanation: 'A primary key uniquely identifies each record in a database table.' },
        { question: 'What is Git used for?', options: ['Version control', 'Web hosting', 'Database management', 'Image editing'], correctAnswer: 'Version control', explanation: 'Git is a distributed version control system for tracking changes in source code.' },
        { question: 'What does RAM stand for?', options: ['Random Access Memory', 'Read Access Memory', 'Rapid Application Memory', 'Runtime Allocation Memory'], correctAnswer: 'Random Access Memory', explanation: 'RAM is volatile memory that provides fast read/write access for running programs.' },
    ],
    'medicine': [
        { question: 'What is the largest organ in the human body?', options: ['Skin', 'Liver', 'Lungs', 'Heart'], correctAnswer: 'Skin', explanation: 'The skin is the largest organ, covering approximately 20 square feet in adults.' },
        { question: 'Which blood type is considered the universal donor?', options: ['O negative', 'AB positive', 'A positive', 'B negative'], correctAnswer: 'O negative', explanation: 'O negative blood can be given to anyone regardless of their blood type.' },
        { question: 'What does DNA stand for?', options: ['Deoxyribonucleic Acid', 'Dinitrogen Acid', 'Dynamic Nucleic Assembly', 'Deoxyribose Nucleic Arrangement'], correctAnswer: 'Deoxyribonucleic Acid', explanation: 'DNA carries genetic instructions for the development and functioning of living organisms.' },
        { question: 'How many chambers does the human heart have?', options: ['4', '2', '3', '6'], correctAnswer: '4', explanation: 'The heart has four chambers: two atria (upper) and two ventricles (lower).' },
        { question: 'Which organ produces insulin?', options: ['Pancreas', 'Liver', 'Kidney', 'Spleen'], correctAnswer: 'Pancreas', explanation: 'The pancreas produces insulin, which regulates blood sugar levels.' },
        { question: 'What is the normal resting heart rate for adults?', options: ['60-100 bpm', '40-60 bpm', '100-120 bpm', '120-150 bpm'], correctAnswer: '60-100 bpm', explanation: 'A normal resting heart rate for adults ranges from 60 to 100 beats per minute.' },
        { question: 'Which vitamin is produced when skin is exposed to sunlight?', options: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'], correctAnswer: 'Vitamin D', explanation: 'The skin synthesizes Vitamin D when exposed to ultraviolet B rays from sunlight.' },
        { question: 'What is the main function of red blood cells?', options: ['Carry oxygen', 'Fight infection', 'Clot blood', 'Produce hormones'], correctAnswer: 'Carry oxygen', explanation: 'Red blood cells contain hemoglobin, which binds and transports oxygen throughout the body.' },
        { question: 'Which bone is the longest in the human body?', options: ['Femur', 'Tibia', 'Humerus', 'Fibula'], correctAnswer: 'Femur', explanation: 'The femur (thigh bone) is the longest and strongest bone in the human body.' },
        { question: 'What does MRI stand for?', options: ['Magnetic Resonance Imaging', 'Medical Radiology Instrument', 'Molecular Radiation Index', 'Magnetic Radiation Imaging'], correctAnswer: 'Magnetic Resonance Imaging', explanation: 'MRI uses magnetic fields and radio waves to create detailed images of organs and tissues.' },
        { question: 'Which part of the brain controls balance and coordination?', options: ['Cerebellum', 'Cerebrum', 'Brain stem', 'Hypothalamus'], correctAnswer: 'Cerebellum', explanation: 'The cerebellum coordinates voluntary movements, balance, and motor learning.' },
        { question: 'What is the normal body temperature in Celsius?', options: ['37°C', '36°C', '38°C', '35°C'], correctAnswer: '37°C', explanation: 'The average normal body temperature is approximately 37°C (98.6°F).' },
        { question: 'Which type of blood vessel carries blood away from the heart?', options: ['Arteries', 'Veins', 'Capillaries', 'Venules'], correctAnswer: 'Arteries', explanation: 'Arteries carry oxygenated blood away from the heart to the body tissues.' },
        { question: 'What is the medical term for high blood pressure?', options: ['Hypertension', 'Hypotension', 'Tachycardia', 'Bradycardia'], correctAnswer: 'Hypertension', explanation: 'Hypertension is the medical term for chronically elevated blood pressure.' },
        { question: 'How many pairs of chromosomes do humans have?', options: ['23', '46', '22', '24'], correctAnswer: '23', explanation: 'Humans have 23 pairs of chromosomes (46 total), with one pair being sex chromosomes.' },
    ],
    'law': [
        { question: 'What is the highest court in the United States?', options: ['Supreme Court', 'Court of Appeals', 'District Court', 'Federal Court'], correctAnswer: 'Supreme Court', explanation: 'The Supreme Court is the highest judicial body in the United States.' },
        { question: 'What does "habeas corpus" mean?', options: ['You shall have the body', 'Guilty as charged', 'Innocent until proven', 'Right to counsel'], correctAnswer: 'You shall have the body', explanation: 'Habeas corpus is a legal order requiring a person to be brought before a court.' },
        { question: 'What is the burden of proof in criminal cases?', options: ['Beyond reasonable doubt', 'Preponderance of evidence', 'Clear and convincing', 'Probable cause'], correctAnswer: 'Beyond reasonable doubt', explanation: 'Criminal cases require proof beyond reasonable doubt, the highest standard of proof.' },
        { question: 'What amendment guarantees freedom of speech in the US?', options: ['First Amendment', 'Second Amendment', 'Fourth Amendment', 'Fifth Amendment'], correctAnswer: 'First Amendment', explanation: 'The First Amendment protects freedom of speech, religion, press, assembly, and petition.' },
        { question: 'What is a plaintiff?', options: ['Person who brings a lawsuit', 'Person being sued', 'The judge', 'A witness'], correctAnswer: 'Person who brings a lawsuit', explanation: 'The plaintiff is the party who initiates a lawsuit against another party (the defendant).' },
        { question: 'What does "pro bono" mean?', options: ['For the public good (free legal work)', 'For profit', 'On behalf of the state', 'With prejudice'], correctAnswer: 'For the public good (free legal work)', explanation: 'Pro bono refers to professional legal work done voluntarily and without payment.' },
        { question: 'What is a tort?', options: ['A civil wrong causing harm', 'A type of contract', 'A criminal offense', 'A court order'], correctAnswer: 'A civil wrong causing harm', explanation: 'A tort is a civil wrong that causes someone to suffer loss or harm, leading to legal liability.' },
        { question: 'What is the Miranda warning about?', options: ['Right to remain silent and have an attorney', 'Right to a speedy trial', 'Right to bail', 'Right to appeal'], correctAnswer: 'Right to remain silent and have an attorney', explanation: 'Miranda rights inform suspects of their constitutional rights during arrest.' },
        { question: 'What is precedent in law?', options: ['A previous court decision used as authority', 'A new law passed by legislature', 'A legal opinion', 'A constitutional amendment'], correctAnswer: 'A previous court decision used as authority', explanation: 'Legal precedent (stare decisis) means courts follow earlier decisions in similar cases.' },
        { question: 'What is the difference between civil and criminal law?', options: ['Civil deals with disputes, criminal with offenses against the state', 'Civil is more serious than criminal', 'Criminal involves only financial penalties', 'There is no difference'], correctAnswer: 'Civil deals with disputes, criminal with offenses against the state', explanation: 'Civil law resolves private disputes; criminal law addresses offenses against society/state.' },
        { question: 'What does "double jeopardy" prohibit?', options: ['Being tried twice for the same offense', 'Having two lawyers', 'Filing two lawsuits', 'Serving on two juries'], correctAnswer: 'Being tried twice for the same offense', explanation: 'The Double Jeopardy Clause prevents a person from being tried twice for the same crime.' },
        { question: 'What is a subpoena?', options: ['A court order to appear or produce documents', 'A type of plea bargain', 'A legal defense', 'A form of bail'], correctAnswer: 'A court order to appear or produce documents', explanation: 'A subpoena is a legal document ordering someone to attend court or produce evidence.' },
        { question: 'What is jurisdiction?', options: ['Authority of a court to hear a case', 'The judge\'s opinion', 'A type of law firm', 'A legal document'], correctAnswer: 'Authority of a court to hear a case', explanation: 'Jurisdiction is the official power of a court to make legal decisions and judgments.' },
        { question: 'What is an affidavit?', options: ['A written sworn statement', 'A court verdict', 'A type of lawsuit', 'A legal fee'], correctAnswer: 'A written sworn statement', explanation: 'An affidavit is a written statement confirmed by oath or affirmation for use as evidence.' },
        { question: 'What does "statute of limitations" refer to?', options: ['Time limit for filing a legal claim', 'Maximum sentence for a crime', 'Number of appeals allowed', 'Limit on jury size'], correctAnswer: 'Time limit for filing a legal claim', explanation: 'The statute of limitations sets the maximum time after an event within which legal proceedings may be initiated.' },
    ],
    'business': [
        { question: 'What does ROI stand for?', options: ['Return on Investment', 'Rate of Interest', 'Revenue on Income', 'Return on Income'], correctAnswer: 'Return on Investment', explanation: 'ROI measures the profitability of an investment relative to its cost.' },
        { question: 'What is a balance sheet?', options: ['A financial statement showing assets, liabilities, and equity', 'A profit and loss statement', 'A cash flow report', 'A tax return'], correctAnswer: 'A financial statement showing assets, liabilities, and equity', explanation: 'A balance sheet provides a snapshot of a company\'s financial position at a point in time.' },
        { question: 'What does GDP stand for?', options: ['Gross Domestic Product', 'General Domestic Production', 'Global Development Plan', 'Gross Distribution Percentage'], correctAnswer: 'Gross Domestic Product', explanation: 'GDP measures the total value of goods and services produced within a country.' },
        { question: 'What is inflation?', options: ['A general increase in prices over time', 'A decrease in unemployment', 'An increase in production', 'A decrease in interest rates'], correctAnswer: 'A general increase in prices over time', explanation: 'Inflation is the rate at which the general level of prices for goods and services rises.' },
        { question: 'What is a monopoly?', options: ['A market with a single seller', 'A market with many sellers', 'A type of stock', 'A government regulation'], correctAnswer: 'A market with a single seller', explanation: 'A monopoly exists when one company is the sole provider of a product or service.' },
        { question: 'What does B2B stand for?', options: ['Business to Business', 'Back to Business', 'Business to Buyer', 'Brand to Business'], correctAnswer: 'Business to Business', explanation: 'B2B refers to transactions or commerce between two businesses rather than a business and consumer.' },
        { question: 'What is equity in business?', options: ['Ownership interest in a company', 'Total revenue', 'Operating costs', 'Debt obligations'], correctAnswer: 'Ownership interest in a company', explanation: 'Equity represents the ownership stake shareholders have in a company.' },
        { question: 'What is a SWOT analysis?', options: ['Strengths, Weaknesses, Opportunities, Threats', 'Sales, Wages, Operations, Taxes', 'Strategy, Work, Output, Timeline', 'Supply, Wholesale, Orders, Trade'], correctAnswer: 'Strengths, Weaknesses, Opportunities, Threats', explanation: 'SWOT analysis is a strategic planning framework for evaluating competitive position.' },
        { question: 'What is liquidity?', options: ['How easily an asset can be converted to cash', 'The total amount of cash a company has', 'The interest rate on loans', 'The profitability of a business'], correctAnswer: 'How easily an asset can be converted to cash', explanation: 'Liquidity measures how quickly assets can be converted into cash without losing value.' },
        { question: 'What is a dividend?', options: ['A payment to shareholders from profits', 'A type of business loan', 'A tax on income', 'An operating expense'], correctAnswer: 'A payment to shareholders from profits', explanation: 'Dividends are distributions of a company\'s earnings to its shareholders.' },
        { question: 'What does IPO stand for?', options: ['Initial Public Offering', 'Internal Profit Operation', 'International Purchase Order', 'Investment Portfolio Option'], correctAnswer: 'Initial Public Offering', explanation: 'An IPO is when a private company offers shares to the public for the first time.' },
        { question: 'What is supply and demand?', options: ['Economic model determining price based on availability and desire', 'A shipping logistics term', 'A manufacturing process', 'A marketing strategy'], correctAnswer: 'Economic model determining price based on availability and desire', explanation: 'Supply and demand is the fundamental economic model that determines prices in a market.' },
        { question: 'What is depreciation?', options: ['Decrease in asset value over time', 'Increase in asset value', 'A type of tax', 'A financial fraud'], correctAnswer: 'Decrease in asset value over time', explanation: 'Depreciation accounts for the gradual loss of value of tangible assets over their useful life.' },
        { question: 'What is a startup?', options: ['A newly established business', 'A type of stock market', 'A government program', 'A banking service'], correctAnswer: 'A newly established business', explanation: 'A startup is a young company founded to develop a unique product or service and bring it to market.' },
        { question: 'What is market capitalization?', options: ['Total market value of a company\'s shares', 'Annual revenue', 'Total number of employees', 'Amount of capital invested'], correctAnswer: 'Total market value of a company\'s shares', explanation: 'Market cap is calculated by multiplying share price by the total number of outstanding shares.' },
    ],
    'engineering': [
        { question: 'What is Ohm\'s Law?', options: ['V = IR', 'F = ma', 'E = mc²', 'P = IV'], correctAnswer: 'V = IR', explanation: 'Ohm\'s Law states that voltage equals current times resistance.' },
        { question: 'What is the unit of electrical resistance?', options: ['Ohm', 'Watt', 'Ampere', 'Volt'], correctAnswer: 'Ohm', explanation: 'The ohm is the SI unit of electrical resistance, named after Georg Ohm.' },
        { question: 'What type of stress occurs when a material is pulled apart?', options: ['Tensile stress', 'Compressive stress', 'Shear stress', 'Torsional stress'], correctAnswer: 'Tensile stress', explanation: 'Tensile stress occurs when forces pull on a material, trying to stretch it.' },
        { question: 'What is thermodynamics?', options: ['Study of heat and energy transfer', 'Study of fluid motion', 'Study of electrical circuits', 'Study of material strength'], correctAnswer: 'Study of heat and energy transfer', explanation: 'Thermodynamics is the branch of physics dealing with heat, work, and energy.' },
        { question: 'What does CAD stand for in engineering?', options: ['Computer-Aided Design', 'Central Architecture Development', 'Computerized Auto Drawing', 'Civil Architecture Design'], correctAnswer: 'Computer-Aided Design', explanation: 'CAD software is used to create precision drawings and technical illustrations.' },
        { question: 'What is the Young\'s modulus?', options: ['A measure of material stiffness', 'A measure of temperature', 'A measure of viscosity', 'A measure of density'], correctAnswer: 'A measure of material stiffness', explanation: 'Young\'s modulus measures the stiffness of a solid material under tension or compression.' },
        { question: 'Which material has the highest tensile strength?', options: ['Steel', 'Wood', 'Concrete', 'Glass'], correctAnswer: 'Steel', explanation: 'Steel has very high tensile strength, making it ideal for structural applications.' },
        { question: 'What is a circuit breaker?', options: ['A safety device that stops electrical flow', 'A device that increases voltage', 'A type of resistor', 'A power generator'], correctAnswer: 'A safety device that stops electrical flow', explanation: 'Circuit breakers automatically interrupt current flow when they detect a fault condition.' },
        { question: 'What is Reynolds number used for?', options: ['Predicting flow patterns in fluids', 'Calculating electrical resistance', 'Measuring material hardness', 'Determining thermal conductivity'], correctAnswer: 'Predicting flow patterns in fluids', explanation: 'Reynolds number helps predict whether fluid flow will be laminar or turbulent.' },
        { question: 'What is the first law of thermodynamics?', options: ['Energy cannot be created or destroyed', 'Entropy always increases', 'Heat flows from hot to cold', 'Force equals mass times acceleration'], correctAnswer: 'Energy cannot be created or destroyed', explanation: 'The first law of thermodynamics states that energy is conserved in any process.' },
        { question: 'What is torque?', options: ['Rotational force', 'Linear speed', 'Electrical current', 'Thermal energy'], correctAnswer: 'Rotational force', explanation: 'Torque is the measure of the force that causes an object to rotate about an axis.' },
        { question: 'What does HVAC stand for?', options: ['Heating, Ventilation, and Air Conditioning', 'High Voltage Alternating Current', 'Hydraulic Valve and Control', 'Heavy Vehicle Assembly Center'], correctAnswer: 'Heating, Ventilation, and Air Conditioning', explanation: 'HVAC refers to systems used for heating, cooling, and ventilating buildings.' },
        { question: 'What is a load-bearing wall?', options: ['A wall that supports the weight of the structure above', 'A wall made of heavy materials', 'A decorative wall', 'An exterior wall only'], correctAnswer: 'A wall that supports the weight of the structure above', explanation: 'Load-bearing walls transfer weight from the roof and upper floors to the foundation.' },
        { question: 'What is Hooke\'s Law?', options: ['Force is proportional to displacement in a spring', 'Every action has an equal reaction', 'Objects at rest stay at rest', 'Energy equals mass times velocity squared'], correctAnswer: 'Force is proportional to displacement in a spring', explanation: 'Hooke\'s Law states that the force needed to extend a spring is proportional to the distance of extension.' },
        { question: 'What is the SI unit of force?', options: ['Newton', 'Joule', 'Pascal', 'Watt'], correctAnswer: 'Newton', explanation: 'The Newton (N) is the SI unit of force, defined as kg·m/s².' },
    ],
    'arts': [
        { question: 'Who painted the Mona Lisa?', options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'], correctAnswer: 'Leonardo da Vinci', explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.' },
        { question: 'What art movement is Salvador Dali associated with?', options: ['Surrealism', 'Impressionism', 'Cubism', 'Realism'], correctAnswer: 'Surrealism', explanation: 'Salvador Dali was a leading figure in the Surrealist art movement.' },
        { question: 'What is the golden ratio approximately equal to?', options: ['1.618', '3.14', '2.718', '1.414'], correctAnswer: '1.618', explanation: 'The golden ratio (phi) is approximately 1.618 and appears frequently in art and nature.' },
        { question: 'Which musical period came first?', options: ['Baroque', 'Classical', 'Romantic', 'Modern'], correctAnswer: 'Baroque', explanation: 'The Baroque period (1600-1750) preceded Classical, Romantic, and Modern periods.' },
        { question: 'What are the three primary colors in painting?', options: ['Red, Blue, Yellow', 'Red, Green, Blue', 'Cyan, Magenta, Yellow', 'Red, White, Blue'], correctAnswer: 'Red, Blue, Yellow', explanation: 'In traditional color theory for painting, red, blue, and yellow are the primary colors.' },
        { question: 'Who wrote "Romeo and Juliet"?', options: ['William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Mark Twain'], correctAnswer: 'William Shakespeare', explanation: 'William Shakespeare wrote Romeo and Juliet around 1594-1596.' },
        { question: 'What is chiaroscuro?', options: ['Use of strong contrasts between light and dark', 'A type of sculpture', 'A musical instrument', 'A printing technique'], correctAnswer: 'Use of strong contrasts between light and dark', explanation: 'Chiaroscuro is an art technique using bold contrasts between light and dark.' },
        { question: 'Which instrument has 88 keys?', options: ['Piano', 'Organ', 'Accordion', 'Harpsichord'], correctAnswer: 'Piano', explanation: 'A standard modern piano has 88 keys (52 white and 36 black).' },
        { question: 'What is typography?', options: ['The art of arranging type', 'A type of photography', 'A painting style', 'A form of dance'], correctAnswer: 'The art of arranging type', explanation: 'Typography is the art and technique of arranging type to make written language readable and appealing.' },
        { question: 'Who composed the "Four Seasons"?', options: ['Antonio Vivaldi', 'Johann Sebastian Bach', 'Ludwig van Beethoven', 'Wolfgang Amadeus Mozart'], correctAnswer: 'Antonio Vivaldi', explanation: 'Antonio Vivaldi composed The Four Seasons, a set of violin concertos, in 1725.' },
        { question: 'What is a fresco?', options: ['Painting on wet plaster', 'A type of sculpture', 'An oil painting technique', 'A ceramic art form'], correctAnswer: 'Painting on wet plaster', explanation: 'Fresco is a mural painting technique where pigments are applied on wet lime plaster.' },
        { question: 'What literary device gives human qualities to non-human things?', options: ['Personification', 'Metaphor', 'Simile', 'Alliteration'], correctAnswer: 'Personification', explanation: 'Personification attributes human characteristics to animals, objects, or abstract concepts.' },
        { question: 'What is the vanishing point in perspective drawing?', options: ['The point where parallel lines appear to converge', 'The center of the canvas', 'The brightest point', 'The focal point of a composition'], correctAnswer: 'The point where parallel lines appear to converge', explanation: 'The vanishing point is where receding parallel lines appear to meet in perspective drawing.' },
        { question: 'Who is considered the father of modern architecture?', options: ['Le Corbusier', 'Frank Lloyd Wright', 'Antoni Gaudi', 'Ludwig Mies van der Rohe'], correctAnswer: 'Le Corbusier', explanation: 'Le Corbusier is widely regarded as one of the pioneers of modern architecture.' },
        { question: 'What is a soliloquy?', options: ['A speech by a character alone on stage', 'A group song', 'A type of poem', 'A musical solo'], correctAnswer: 'A speech by a character alone on stage', explanation: 'A soliloquy is a dramatic device where a character speaks their thoughts aloud while alone.' },
    ],
    'sciences': [
        { question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctAnswer: 'H2O', explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.' },
        { question: 'What is the speed of light approximately?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correctAnswer: '300,000 km/s', explanation: 'The speed of light in a vacuum is approximately 299,792 km/s.' },
        { question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria generate most of the cell\'s supply of ATP, the energy currency.' },
        { question: 'What is Newton\'s second law of motion?', options: ['F = ma', 'E = mc²', 'V = IR', 'PV = nRT'], correctAnswer: 'F = ma', explanation: 'Newton\'s second law states that force equals mass times acceleration.' },
        { question: 'What is the atomic number of carbon?', options: ['6', '12', '8', '14'], correctAnswer: '6', explanation: 'Carbon has 6 protons in its nucleus, giving it an atomic number of 6.' },
        { question: 'What is photosynthesis?', options: ['Process by which plants convert light to energy', 'Process of cell division', 'Process of protein synthesis', 'Process of digestion'], correctAnswer: 'Process by which plants convert light to energy', explanation: 'Photosynthesis converts carbon dioxide and water into glucose and oxygen using sunlight.' },
        { question: 'What is the pH of pure water?', options: ['7', '0', '14', '1'], correctAnswer: '7', explanation: 'Pure water has a neutral pH of 7, neither acidic nor basic.' },
        { question: 'What planet is known as the Red Planet?', options: ['Mars', 'Jupiter', 'Venus', 'Mercury'], correctAnswer: 'Mars', explanation: 'Mars appears red due to iron oxide (rust) on its surface.' },
        { question: 'What is the theory of relativity associated with?', options: ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Stephen Hawking'], correctAnswer: 'Albert Einstein', explanation: 'Albert Einstein published his theories of special and general relativity in 1905 and 1915.' },
        { question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'], correctAnswer: 'Nitrogen', explanation: 'Nitrogen makes up approximately 78% of Earth\'s atmosphere.' },
        { question: 'What is an isotope?', options: ['Atoms of the same element with different neutron counts', 'A type of chemical bond', 'A radioactive particle', 'A unit of measurement'], correctAnswer: 'Atoms of the same element with different neutron counts', explanation: 'Isotopes are variants of an element with the same number of protons but different neutrons.' },
        { question: 'What is the Heisenberg Uncertainty Principle?', options: ['You cannot simultaneously know exact position and momentum', 'Energy is always conserved', 'Matter cannot be created or destroyed', 'Light is both a wave and particle'], correctAnswer: 'You cannot simultaneously know exact position and momentum', explanation: 'The principle states there is a fundamental limit to precision of certain pairs of measurements.' },
        { question: 'What is the process of cell division called?', options: ['Mitosis', 'Osmosis', 'Photosynthesis', 'Respiration'], correctAnswer: 'Mitosis', explanation: 'Mitosis is the process where a single cell divides to produce two identical daughter cells.' },
        { question: 'What is absolute zero?', options: ['-273.15°C', '0°C', '-100°C', '-459.67°C'], correctAnswer: '-273.15°C', explanation: 'Absolute zero (-273.15°C or 0 Kelvin) is the lowest possible temperature where molecular motion ceases.' },
        { question: 'What is the chemical formula for table salt?', options: ['NaCl', 'KCl', 'CaCl2', 'MgCl2'], correctAnswer: 'NaCl', explanation: 'Table salt is sodium chloride, made of sodium (Na) and chlorine (Cl) ions.' },
    ],
    'general': [
        { question: 'What is the capital of Japan?', options: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya'], correctAnswer: 'Tokyo', explanation: 'Tokyo has been the capital of Japan since 1868.' },
        { question: 'How many continents are there?', options: ['7', '5', '6', '8'], correctAnswer: '7', explanation: 'The seven continents are Africa, Antarctica, Asia, Australia, Europe, North America, and South America.' },
        { question: 'What year did World War II end?', options: ['1945', '1944', '1946', '1943'], correctAnswer: '1945', explanation: 'World War II ended in 1945 with the surrender of Germany in May and Japan in September.' },
        { question: 'What is the largest ocean on Earth?', options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], correctAnswer: 'Pacific Ocean', explanation: 'The Pacific Ocean covers more than 60 million square miles, making it the largest ocean.' },
        { question: 'Who invented the telephone?', options: ['Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Guglielmo Marconi'], correctAnswer: 'Alexander Graham Bell', explanation: 'Alexander Graham Bell was awarded the patent for the telephone in 1876.' },
        { question: 'What is the tallest mountain in the world?', options: ['Mount Everest', 'K2', 'Kangchenjunga', 'Mount Kilimanjaro'], correctAnswer: 'Mount Everest', explanation: 'Mount Everest stands at 8,849 meters (29,032 feet) above sea level.' },
        { question: 'How many planets are in our solar system?', options: ['8', '9', '7', '10'], correctAnswer: '8', explanation: 'There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.' },
        { question: 'What is the currency of the United Kingdom?', options: ['Pound Sterling', 'Euro', 'Dollar', 'Franc'], correctAnswer: 'Pound Sterling', explanation: 'The pound sterling (GBP) is the official currency of the United Kingdom.' },
        { question: 'Who wrote "A Brief History of Time"?', options: ['Stephen Hawking', 'Albert Einstein', 'Carl Sagan', 'Neil deGrasse Tyson'], correctAnswer: 'Stephen Hawking', explanation: 'Stephen Hawking published A Brief History of Time in 1988.' },
        { question: 'What is the Great Wall of China primarily made of?', options: ['Stone, brick, and rammed earth', 'Wood and bamboo', 'Metal and concrete', 'Clay and sand'], correctAnswer: 'Stone, brick, and rammed earth', explanation: 'The Great Wall was built using various materials including stone, brick, tamped earth, and other materials.' },
        { question: 'What is the smallest country in the world by area?', options: ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'], correctAnswer: 'Vatican City', explanation: 'Vatican City is approximately 0.44 sq km (0.17 sq mi), making it the smallest country.' },
        { question: 'Which element has the chemical symbol "Au"?', options: ['Gold', 'Silver', 'Aluminum', 'Argon'], correctAnswer: 'Gold', explanation: 'Au comes from the Latin word "aurum" meaning gold.' },
        { question: 'What is the longest river in the world?', options: ['Nile', 'Amazon', 'Yangtze', 'Mississippi'], correctAnswer: 'Nile', explanation: 'The Nile River stretches approximately 6,650 km (4,130 miles) through northeastern Africa.' },
        { question: 'In what year did the Berlin Wall fall?', options: ['1989', '1991', '1987', '1990'], correctAnswer: '1989', explanation: 'The Berlin Wall fell on November 9, 1989, marking the end of the Cold War era.' },
        { question: 'What is the hardest natural substance on Earth?', options: ['Diamond', 'Quartz', 'Sapphire', 'Titanium'], correctAnswer: 'Diamond', explanation: 'Diamond is the hardest known natural material, scoring 10 on the Mohs hardness scale.' },
    ],
    'psychology': [
        { question: 'Who is considered the father of psychoanalysis?', options: ['Sigmund Freud', 'Carl Jung', 'B.F. Skinner', 'Ivan Pavlov'], correctAnswer: 'Sigmund Freud', explanation: 'Freud developed psychoanalysis as a clinical method for treating psychopathology.' },
        { question: 'What does CBT stand for in therapy?', options: ['Cognitive Behavioral Therapy', 'Clinical Brain Testing', 'Controlled Behavior Training', 'Conscious Body Therapy'], correctAnswer: 'Cognitive Behavioral Therapy', explanation: 'CBT focuses on changing unhelpful cognitive distortions and behaviors.' },
        { question: 'Which part of the brain is responsible for memory?', options: ['Hippocampus', 'Cerebellum', 'Frontal lobe', 'Brain stem'], correctAnswer: 'Hippocampus', explanation: 'The hippocampus plays a critical role in forming new memories.' },
        { question: 'What is the fight-or-flight response controlled by?', options: ['Sympathetic nervous system', 'Parasympathetic nervous system', 'Central nervous system', 'Somatic nervous system'], correctAnswer: 'Sympathetic nervous system', explanation: 'The sympathetic nervous system triggers the fight-or-flight response during stress.' },
        { question: 'What is Maslow\'s highest level of need?', options: ['Self-actualization', 'Esteem', 'Love/belonging', 'Safety'], correctAnswer: 'Self-actualization', explanation: 'Self-actualization is the realization of one\'s full potential at the top of Maslow\'s hierarchy.' },
        { question: 'What is classical conditioning?', options: ['Learning through association', 'Learning through rewards', 'Learning through observation', 'Learning through trial and error'], correctAnswer: 'Learning through association', explanation: 'Pavlov demonstrated classical conditioning by pairing a neutral stimulus with an unconditioned response.' },
        { question: 'What does IQ stand for?', options: ['Intelligence Quotient', 'Internal Quality', 'Intellectual Quantity', 'Information Query'], correctAnswer: 'Intelligence Quotient', explanation: 'IQ is a score derived from standardized tests designed to assess human intelligence.' },
        { question: 'Who developed the hierarchy of needs?', options: ['Abraham Maslow', 'Carl Rogers', 'Erik Erikson', 'Jean Piaget'], correctAnswer: 'Abraham Maslow', explanation: 'Maslow proposed a five-tier model of human needs in 1943.' },
        { question: 'What is the placebo effect?', options: ['Improvement from believing treatment works', 'Side effect of medication', 'Result of sleep deprivation', 'A type of mental disorder'], correctAnswer: 'Improvement from believing treatment works', explanation: 'The placebo effect occurs when a patient improves simply because they believe the treatment is effective.' },
        { question: 'Which stage is NOT part of Erikson\'s psychosocial development?', options: ['Sensorimotor stage', 'Trust vs Mistrust', 'Identity vs Role Confusion', 'Integrity vs Despair'], correctAnswer: 'Sensorimotor stage', explanation: 'Sensorimotor stage belongs to Piaget\'s cognitive development theory, not Erikson\'s.' },
        { question: 'What is cognitive dissonance?', options: ['Mental discomfort from conflicting beliefs', 'Inability to remember events', 'A type of learning disability', 'Fear of social situations'], correctAnswer: 'Mental discomfort from conflicting beliefs', explanation: 'Cognitive dissonance occurs when someone holds contradictory beliefs or behaviors simultaneously.' },
        { question: 'What neurotransmitter is associated with happiness?', options: ['Serotonin', 'Adrenaline', 'Cortisol', 'Acetylcholine'], correctAnswer: 'Serotonin', explanation: 'Serotonin is a neurotransmitter that contributes to feelings of well-being and happiness.' },
        { question: 'What is REM sleep?', options: ['Rapid Eye Movement sleep', 'Restful Energy Mode', 'Reduced External Motion', 'Relaxed Emotional Mode'], correctAnswer: 'Rapid Eye Movement sleep', explanation: 'REM sleep is a phase characterized by rapid eye movement, vivid dreams, and brain activity similar to waking.' },
        { question: 'What is attachment theory primarily associated with?', options: ['John Bowlby', 'Sigmund Freud', 'B.F. Skinner', 'Albert Bandura'], correctAnswer: 'John Bowlby', explanation: 'Bowlby proposed that early bonds with caregivers have a major impact on development.' },
        { question: 'What is groupthink?', options: ['Desire for harmony overrides realistic appraisal', 'Thinking in group therapy', 'Collective intelligence', 'Brainstorming technique'], correctAnswer: 'Desire for harmony overrides realistic appraisal', explanation: 'Groupthink leads to poor decision-making because group members suppress dissenting opinions.' },
    ],
    'history': [
        { question: 'In which year did World War I begin?', options: ['1914', '1916', '1912', '1918'], correctAnswer: '1914', explanation: 'WWI began in 1914 after the assassination of Archduke Franz Ferdinand.' },
        { question: 'Who was the first President of the United States?', options: ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'], correctAnswer: 'George Washington', explanation: 'Washington served as the first U.S. president from 1789 to 1797.' },
        { question: 'The Renaissance began in which country?', options: ['Italy', 'France', 'England', 'Germany'], correctAnswer: 'Italy', explanation: 'The Renaissance originated in Italy during the 14th century.' },
        { question: 'Who led the Indian independence movement?', options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Subhas Chandra Bose', 'Bhagat Singh'], correctAnswer: 'Mahatma Gandhi', explanation: 'Gandhi led India to independence through nonviolent civil disobedience.' },
        { question: 'What was the Cold War primarily between?', options: ['USA and Soviet Union', 'USA and China', 'UK and Germany', 'France and Russia'], correctAnswer: 'USA and Soviet Union', explanation: 'The Cold War was a geopolitical tension between the USA and USSR from 1947 to 1991.' },
        { question: 'Which empire built the Colosseum?', options: ['Roman Empire', 'Greek Empire', 'Ottoman Empire', 'Persian Empire'], correctAnswer: 'Roman Empire', explanation: 'The Colosseum was built in Rome under Emperor Vespasian around 70-80 AD.' },
        { question: 'What was the French Revolution about?', options: ['Overthrowing the monarchy', 'Colonial expansion', 'Religious reform', 'Trade disputes'], correctAnswer: 'Overthrowing the monarchy', explanation: 'The French Revolution (1789-1799) overthrew the monarchy and established a republic.' },
        { question: 'Who discovered America in 1492?', options: ['Christopher Columbus', 'Amerigo Vespucci', 'Leif Erikson', 'Marco Polo'], correctAnswer: 'Christopher Columbus', explanation: 'Columbus reached the Americas in 1492, though Vikings had arrived centuries earlier.' },
        { question: 'What ancient civilization built the pyramids?', options: ['Egyptian', 'Mesopotamian', 'Mayan', 'Greek'], correctAnswer: 'Egyptian', explanation: 'The ancient Egyptians built the pyramids as tombs for their pharaohs.' },
        { question: 'When did apartheid end in South Africa?', options: ['1994', '1990', '1988', '1996'], correctAnswer: '1994', explanation: 'Apartheid officially ended with the 1994 elections when Nelson Mandela became president.' },
        { question: 'Which treaty ended World War I?', options: ['Treaty of Versailles', 'Treaty of Paris', 'Treaty of Vienna', 'Treaty of Rome'], correctAnswer: 'Treaty of Versailles', explanation: 'The Treaty of Versailles was signed in 1919, officially ending WWI.' },
        { question: 'Who was the first female Prime Minister of the UK?', options: ['Margaret Thatcher', 'Theresa May', 'Queen Victoria', 'Elizabeth I'], correctAnswer: 'Margaret Thatcher', explanation: 'Thatcher served as PM from 1979 to 1990.' },
        { question: 'What was the Silk Road?', options: ['Ancient trade route between East and West', 'A type of fabric', 'A river in China', 'A military path'], correctAnswer: 'Ancient trade route between East and West', explanation: 'The Silk Road was a network of trade routes connecting China to the Mediterranean.' },
        { question: 'Which country was formerly known as Persia?', options: ['Iran', 'Iraq', 'Turkey', 'Afghanistan'], correctAnswer: 'Iran', explanation: 'Persia was officially renamed Iran in 1935.' },
        { question: 'What event started World War II?', options: ['Germany invaded Poland', 'Pearl Harbor attack', 'Treaty of Versailles', 'Russian Revolution'], correctAnswer: 'Germany invaded Poland', explanation: 'Germany\'s invasion of Poland on September 1, 1939 triggered WWII.' },
    ],
    'languages': [
        { question: 'How many official languages does the UN have?', options: ['6', '4', '8', '10'], correctAnswer: '6', explanation: 'The UN has 6 official languages: Arabic, Chinese, English, French, Russian, and Spanish.' },
        { question: 'What is the most spoken language in the world by native speakers?', options: ['Mandarin Chinese', 'English', 'Spanish', 'Hindi'], correctAnswer: 'Mandarin Chinese', explanation: 'Mandarin has approximately 920 million native speakers worldwide.' },
        { question: 'What is a "cognate" in linguistics?', options: ['Words with common origin in different languages', 'A verb form', 'A type of grammar rule', 'A dialect'], correctAnswer: 'Words with common origin in different languages', explanation: 'Cognates are words that share a common etymological origin across languages.' },
        { question: 'Which language family does English belong to?', options: ['Germanic', 'Romance', 'Slavic', 'Celtic'], correctAnswer: 'Germanic', explanation: 'English is a West Germanic language closely related to Frisian and Dutch.' },
        { question: 'What is syntax?', options: ['The arrangement of words in sentences', 'The meaning of words', 'The sound of speech', 'The origin of words'], correctAnswer: 'The arrangement of words in sentences', explanation: 'Syntax deals with the rules governing sentence structure.' },
        { question: 'What is an adjective?', options: ['A word that describes a noun', 'An action word', 'A connecting word', 'A naming word'], correctAnswer: 'A word that describes a noun', explanation: 'Adjectives modify nouns by describing qualities, quantities, or states.' },
        { question: 'Which of these is a Romance language?', options: ['Portuguese', 'German', 'Swedish', 'Polish'], correctAnswer: 'Portuguese', explanation: 'Romance languages descended from Latin include Portuguese, Spanish, French, Italian, and Romanian.' },
        { question: 'What is onomatopoeia?', options: ['Words that imitate sounds', 'Words with opposite meanings', 'Exaggerated statements', 'Comparison using like or as'], correctAnswer: 'Words that imitate sounds', explanation: 'Examples include "buzz", "hiss", "bang", and "splash".' },
        { question: 'What is the study of word meanings called?', options: ['Semantics', 'Phonetics', 'Morphology', 'Pragmatics'], correctAnswer: 'Semantics', explanation: 'Semantics is the branch of linguistics concerned with meaning in language.' },
        { question: 'What is a palindrome?', options: ['A word that reads the same forward and backward', 'A word with multiple meanings', 'A word borrowed from another language', 'A word that sounds like another'], correctAnswer: 'A word that reads the same forward and backward', explanation: 'Examples include "racecar", "madam", and "level".' },
        { question: 'Which language has the most words?', options: ['English', 'Chinese', 'Arabic', 'French'], correctAnswer: 'English', explanation: 'English has over 170,000 words currently in use according to the Oxford Dictionary.' },
        { question: 'What is a metaphor?', options: ['A figure of speech comparing two unlike things directly', 'A comparison using like or as', 'An exaggerated statement', 'A question that needs no answer'], correctAnswer: 'A figure of speech comparing two unlike things directly', explanation: 'Unlike similes, metaphors state the comparison directly: "Time is money."' },
        { question: 'What does "bilingual" mean?', options: ['Speaking two languages', 'Speaking one language', 'Speaking three languages', 'Unable to speak'], correctAnswer: 'Speaking two languages', explanation: 'Bilingual means the ability to speak and understand two languages fluently.' },
        { question: 'What is the International Phonetic Alphabet used for?', options: ['Standardized representation of speech sounds', 'Coding messages', 'Sign language', 'Musical notation'], correctAnswer: 'Standardized representation of speech sounds', explanation: 'The IPA provides a universal system for transcribing speech sounds from any language.' },
        { question: 'Which language is written right to left?', options: ['Arabic', 'Chinese', 'Japanese', 'Greek'], correctAnswer: 'Arabic', explanation: 'Arabic, Hebrew, and Persian are among languages written from right to left.' },
    ],
    'economics': [
        { question: 'What does GDP stand for?', options: ['Gross Domestic Product', 'General Domestic Price', 'Global Development Program', 'Government Debt Position'], correctAnswer: 'Gross Domestic Product', explanation: 'GDP measures the total value of goods and services produced within a country.' },
        { question: 'What is inflation?', options: ['General increase in prices over time', 'Decrease in prices', 'Increase in employment', 'Decrease in taxes'], correctAnswer: 'General increase in prices over time', explanation: 'Inflation reduces the purchasing power of money as prices rise.' },
        { question: 'What is supply and demand?', options: ['Economic model of price determination', 'A type of business plan', 'A government policy', 'A tax system'], correctAnswer: 'Economic model of price determination', explanation: 'Supply and demand determines equilibrium price in a competitive market.' },
        { question: 'What is a monopoly?', options: ['One seller dominates the market', 'Many sellers compete', 'Government-owned business', 'A type of tax'], correctAnswer: 'One seller dominates the market', explanation: 'A monopoly exists when a single company controls the entire market for a product.' },
        { question: 'Who wrote "The Wealth of Nations"?', options: ['Adam Smith', 'Karl Marx', 'John Keynes', 'Milton Friedman'], correctAnswer: 'Adam Smith', explanation: 'Adam Smith\'s 1776 work is considered the foundation of modern economics.' },
        { question: 'What is a recession?', options: ['Two consecutive quarters of negative GDP growth', 'A period of high inflation', 'An increase in unemployment', 'A government spending cut'], correctAnswer: 'Two consecutive quarters of negative GDP growth', explanation: 'A recession is commonly defined as two consecutive quarters of declining GDP.' },
        { question: 'What does the Federal Reserve do?', options: ['Controls monetary policy', 'Collects taxes', 'Makes laws', 'Manages trade deals'], correctAnswer: 'Controls monetary policy', explanation: 'The Fed manages the money supply, interest rates, and banking regulation.' },
        { question: 'What is opportunity cost?', options: ['The value of the next best alternative given up', 'The price of a product', 'The cost of production', 'A tax payment'], correctAnswer: 'The value of the next best alternative given up', explanation: 'Every choice has an opportunity cost — what you sacrifice by not choosing the alternative.' },
        { question: 'What is fiscal policy?', options: ['Government spending and taxation decisions', 'Central bank interest rate decisions', 'Trade agreements', 'Price controls'], correctAnswer: 'Government spending and taxation decisions', explanation: 'Fiscal policy involves government adjustments to spending and taxes to influence the economy.' },
        { question: 'What is a trade deficit?', options: ['Imports exceed exports', 'Exports exceed imports', 'Government debt exceeds revenue', 'Savings exceed investments'], correctAnswer: 'Imports exceed exports', explanation: 'A trade deficit occurs when a country buys more from abroad than it sells.' },
        { question: 'What is microeconomics?', options: ['Study of individual and business decisions', 'Study of the whole economy', 'Study of government policy', 'Study of international trade'], correctAnswer: 'Study of individual and business decisions', explanation: 'Microeconomics focuses on individual actors in the economy — consumers, firms, and industries.' },
        { question: 'What is cryptocurrency?', options: ['Digital currency using cryptography', 'Government-backed digital money', 'A type of stock', 'A banking system'], correctAnswer: 'Digital currency using cryptography', explanation: 'Cryptocurrencies like Bitcoin use blockchain technology and cryptographic security.' },
        { question: 'What is the law of diminishing returns?', options: ['Adding more input eventually yields less additional output', 'More workers always means more production', 'Prices always decrease over time', 'Supply always meets demand'], correctAnswer: 'Adding more input eventually yields less additional output', explanation: 'Beyond an optimal point, each additional unit of input produces less additional output.' },
        { question: 'What is a stock market?', options: ['A marketplace for buying and selling shares', 'A government institution', 'A type of bank', 'A physical store'], correctAnswer: 'A marketplace for buying and selling shares', explanation: 'Stock markets facilitate the buying and selling of ownership stakes in companies.' },
        { question: 'What is deflation?', options: ['General decrease in prices', 'General increase in prices', 'Increase in wages', 'Decrease in unemployment'], correctAnswer: 'General decrease in prices', explanation: 'Deflation increases the purchasing power of money but can signal economic problems.' },
    ],
    'geography': [
        { question: 'What is the largest continent by area?', options: ['Asia', 'Africa', 'North America', 'Europe'], correctAnswer: 'Asia', explanation: 'Asia covers approximately 44.58 million square kilometers.' },
        { question: 'Which country has the most time zones?', options: ['France', 'Russia', 'USA', 'China'], correctAnswer: 'France', explanation: 'France has 12 time zones due to its overseas territories.' },
        { question: 'What is the smallest country in the world?', options: ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'], correctAnswer: 'Vatican City', explanation: 'Vatican City covers only 0.44 square kilometers.' },
        { question: 'Which ocean is the largest?', options: ['Pacific', 'Atlantic', 'Indian', 'Arctic'], correctAnswer: 'Pacific', explanation: 'The Pacific Ocean covers more area than all land surfaces combined.' },
        { question: 'What is the capital of Australia?', options: ['Canberra', 'Sydney', 'Melbourne', 'Perth'], correctAnswer: 'Canberra', explanation: 'Canberra was purpose-built as the capital as a compromise between Sydney and Melbourne.' },
        { question: 'Which desert is the largest hot desert?', options: ['Sahara', 'Arabian', 'Gobi', 'Kalahari'], correctAnswer: 'Sahara', explanation: 'The Sahara covers 9.2 million square kilometers across North Africa.' },
        { question: 'What is the longest mountain range?', options: ['Andes', 'Himalayas', 'Rocky Mountains', 'Alps'], correctAnswer: 'Andes', explanation: 'The Andes stretch over 7,000 km along the west coast of South America.' },
        { question: 'Which African country has the largest population?', options: ['Nigeria', 'Ethiopia', 'Egypt', 'South Africa'], correctAnswer: 'Nigeria', explanation: 'Nigeria has over 220 million people, making it Africa\'s most populous country.' },
        { question: 'What is the deepest point in the ocean?', options: ['Mariana Trench', 'Puerto Rico Trench', 'Java Trench', 'Tonga Trench'], correctAnswer: 'Mariana Trench', explanation: 'The Challenger Deep in the Mariana Trench reaches nearly 11,000 meters deep.' },
        { question: 'Which river flows through the most countries?', options: ['Danube', 'Nile', 'Amazon', 'Rhine'], correctAnswer: 'Danube', explanation: 'The Danube flows through 10 countries in Europe.' },
        { question: 'What causes tides?', options: ['Gravitational pull of the Moon', 'Wind patterns', 'Earth\'s rotation', 'Ocean currents'], correctAnswer: 'Gravitational pull of the Moon', explanation: 'The Moon\'s gravity causes the regular rise and fall of ocean tides.' },
        { question: 'Which country is both in Europe and Asia?', options: ['Turkey', 'Greece', 'Iran', 'Egypt'], correctAnswer: 'Turkey', explanation: 'Turkey spans both continents, with Istanbul straddling the Bosphorus strait.' },
        { question: 'What is the Ring of Fire?', options: ['Zone of frequent earthquakes and volcanoes around the Pacific', 'A desert region', 'A forest fire zone', 'A tropical storm belt'], correctAnswer: 'Zone of frequent earthquakes and volcanoes around the Pacific', explanation: 'The Ring of Fire has 75% of the world\'s volcanoes and 90% of its earthquakes.' },
        { question: 'What is the largest island in the world?', options: ['Greenland', 'New Guinea', 'Borneo', 'Madagascar'], correctAnswer: 'Greenland', explanation: 'Greenland covers 2.166 million square kilometers (Australia is considered a continent).' },
        { question: 'Which country has the longest coastline?', options: ['Canada', 'Indonesia', 'Norway', 'Australia'], correctAnswer: 'Canada', explanation: 'Canada has the longest coastline at approximately 202,080 km.' },
    ],
    'philosophy': [
        { question: 'Who said "I think, therefore I am"?', options: ['Rene Descartes', 'Socrates', 'Aristotle', 'Plato'], correctAnswer: 'Rene Descartes', explanation: 'Descartes\' "Cogito, ergo sum" is a foundational element of Western philosophy.' },
        { question: 'What is ethics?', options: ['Study of right and wrong conduct', 'Study of beauty', 'Study of knowledge', 'Study of existence'], correctAnswer: 'Study of right and wrong conduct', explanation: 'Ethics examines moral principles that govern behavior.' },
        { question: 'Who was the teacher of Alexander the Great?', options: ['Aristotle', 'Plato', 'Socrates', 'Epicurus'], correctAnswer: 'Aristotle', explanation: 'Aristotle tutored Alexander from age 13 until he ascended the throne.' },
        { question: 'What is utilitarianism?', options: ['Greatest happiness for the greatest number', 'Follow rules regardless of outcome', 'Act according to virtue', 'Maximize personal gain'], correctAnswer: 'Greatest happiness for the greatest number', explanation: 'Utilitarianism, developed by Bentham and Mill, judges actions by their outcomes.' },
        { question: 'What is Plato\'s Allegory of the Cave about?', options: ['The nature of reality and perception', 'Political leadership', 'Religious beliefs', 'Mathematical truth'], correctAnswer: 'The nature of reality and perception', explanation: 'The allegory illustrates how people can be trapped by limited perception of reality.' },
        { question: 'What is existentialism?', options: ['Philosophy emphasizing individual existence and freedom', 'Belief in predetermined fate', 'Study of logic', 'Belief that nothing exists'], correctAnswer: 'Philosophy emphasizing individual existence and freedom', explanation: 'Existentialism holds that individuals create meaning through choices and actions.' },
        { question: 'Who wrote "The Republic"?', options: ['Plato', 'Aristotle', 'Socrates', 'Homer'], correctAnswer: 'Plato', explanation: 'The Republic discusses justice and the ideal state through Socratic dialogue.' },
        { question: 'What is nihilism?', options: ['Belief that life has no inherent meaning', 'Belief in God', 'Study of numbers', 'Political ideology'], correctAnswer: 'Belief that life has no inherent meaning', explanation: 'Nihilism rejects generally accepted moral principles and the idea of objective meaning.' },
        { question: 'What is the trolley problem?', options: ['An ethical thought experiment about sacrificing one to save many', 'A physics problem', 'A mathematical puzzle', 'A political debate'], correctAnswer: 'An ethical thought experiment about sacrificing one to save many', explanation: 'The trolley problem explores the ethics of action vs inaction in life-or-death scenarios.' },
        { question: 'Who is associated with "the will to power"?', options: ['Friedrich Nietzsche', 'Karl Marx', 'John Locke', 'Immanuel Kant'], correctAnswer: 'Friedrich Nietzsche', explanation: 'Nietzsche described the will to power as a fundamental driving force in humans.' },
        { question: 'What is epistemology?', options: ['Study of knowledge', 'Study of ethics', 'Study of beauty', 'Study of language'], correctAnswer: 'Study of knowledge', explanation: 'Epistemology examines the nature, origin, and limits of human knowledge.' },
        { question: 'What is the Socratic method?', options: ['Teaching through asking questions', 'Lecturing to students', 'Writing essays', 'Memorizing facts'], correctAnswer: 'Teaching through asking questions', explanation: 'Socrates used dialogical questioning to stimulate critical thinking.' },
        { question: 'What is stoicism?', options: ['Enduring hardship without complaint through virtue', 'Pursuing pleasure', 'Rejecting all beliefs', 'Following strict rules'], correctAnswer: 'Enduring hardship without virtue through virtue', explanation: 'Stoicism teaches controlling emotions and accepting what cannot be changed.' },
        { question: 'Who wrote "Being and Nothingness"?', options: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Martin Heidegger'], correctAnswer: 'Jean-Paul Sartre', explanation: 'Sartre\'s 1943 work is a foundational text of existentialist philosophy.' },
        { question: 'What is moral relativism?', options: ['Morality varies by culture and situation', 'Universal moral truths exist', 'Morality is determined by God', 'There is no morality'], correctAnswer: 'Morality varies by culture and situation', explanation: 'Moral relativism holds that ethical standards are not absolute but depend on context.' },
    ],
    'agriculture': [
        { question: 'What is photosynthesis?', options: ['Process plants use to convert sunlight into energy', 'Process of soil formation', 'Water absorption by roots', 'Decomposition of matter'], correctAnswer: 'Process plants use to convert sunlight into energy', explanation: 'Photosynthesis converts CO2 and water into glucose and oxygen using sunlight.' },
        { question: 'What is crop rotation?', options: ['Growing different crops in sequence on the same land', 'Rotating machinery', 'Harvesting in circles', 'Spinning crops after harvest'], correctAnswer: 'Growing different crops in sequence on the same land', explanation: 'Crop rotation helps maintain soil health and reduce pest buildup.' },
        { question: 'What is the most widely grown crop in the world?', options: ['Wheat', 'Rice', 'Corn', 'Barley'], correctAnswer: 'Wheat', explanation: 'Wheat is grown on more land area than any other crop globally.' },
        { question: 'What is irrigation?', options: ['Artificial application of water to crops', 'Natural rainfall', 'Removing water from fields', 'Soil testing'], correctAnswer: 'Artificial application of water to crops', explanation: 'Irrigation supplements natural rainfall to ensure crops receive adequate water.' },
        { question: 'What does organic farming avoid?', options: ['Synthetic pesticides and fertilizers', 'Water', 'Sunlight', 'Soil'], correctAnswer: 'Synthetic pesticides and fertilizers', explanation: 'Organic farming relies on natural methods for pest control and fertilization.' },
        { question: 'What is soil pH important for?', options: ['Nutrient availability to plants', 'Soil color', 'Soil temperature', 'Soil weight'], correctAnswer: 'Nutrient availability to plants', explanation: 'pH affects which nutrients are available for plant uptake from the soil.' },
        { question: 'What is hydroponics?', options: ['Growing plants without soil', 'Growing plants in dark', 'Underwater farming', 'Desert farming'], correctAnswer: 'Growing plants without soil', explanation: 'Hydroponics uses nutrient-rich water solutions instead of soil.' },
        { question: 'What is the Green Revolution?', options: ['Increase in agricultural production through technology', 'An environmental protest', 'A type of fertilizer', 'A plant disease'], correctAnswer: 'Increase in agricultural production through technology', explanation: 'The Green Revolution dramatically increased crop yields through improved seeds, fertilizers, and irrigation.' },
        { question: 'What is composting?', options: ['Decomposing organic matter to create fertilizer', 'Burning crop waste', 'Freezing soil', 'Chemical soil treatment'], correctAnswer: 'Decomposing organic matter to create fertilizer', explanation: 'Composting recycles organic waste into nutrient-rich soil amendment.' },
        { question: 'What is a greenhouse used for?', options: ['Controlled environment for growing plants', 'Storing harvested crops', 'Housing farm animals', 'Processing food'], correctAnswer: 'Controlled environment for growing plants', explanation: 'Greenhouses trap heat and allow year-round growing in controlled conditions.' },
        { question: 'What is pollination?', options: ['Transfer of pollen for plant reproduction', 'Watering plants', 'Adding fertilizer', 'Pruning branches'], correctAnswer: 'Transfer of pollen for plant reproduction', explanation: 'Pollination by insects, wind, or water is essential for fruit and seed production.' },
        { question: 'What is sustainable agriculture?', options: ['Farming that meets current needs without compromising future resources', 'Farming for maximum short-term profit', 'Only growing one crop', 'Using maximum chemicals'], correctAnswer: 'Farming that meets current needs without compromising future resources', explanation: 'Sustainable agriculture balances productivity with environmental stewardship.' },
        { question: 'What is a cash crop?', options: ['A crop grown primarily for sale', 'A crop grown for personal use', 'A crop that costs nothing', 'A crop that grows fast'], correctAnswer: 'A crop grown primarily for sale', explanation: 'Cash crops like coffee, cotton, and cocoa are grown for commercial profit.' },
        { question: 'What is nitrogen fixation?', options: ['Converting atmospheric nitrogen into usable form', 'Adding nitrogen fertilizer', 'Removing nitrogen from soil', 'Testing soil nitrogen'], correctAnswer: 'Converting atmospheric nitrogen into usable form', explanation: 'Bacteria in legume root nodules convert N2 gas into ammonia that plants can use.' },
        { question: 'What is agroforestry?', options: ['Combining trees with crops or livestock', 'Cutting down forests for farming', 'Growing only trees', 'Forest conservation'], correctAnswer: 'Combining trees with crops or livestock', explanation: 'Agroforestry integrates trees into farming systems for ecological and economic benefits.' },
    ],
    'architecture': [
        { question: 'Who designed the Guggenheim Museum in New York?', options: ['Frank Lloyd Wright', 'Le Corbusier', 'Zaha Hadid', 'Frank Gehry'], correctAnswer: 'Frank Lloyd Wright', explanation: 'Wright designed the iconic spiral building which opened in 1959.' },
        { question: 'What is a flying buttress?', options: ['An external support structure for walls', 'A type of roof', 'A window design', 'A foundation type'], correctAnswer: 'An external support structure for walls', explanation: 'Flying buttresses transfer the weight of walls outward, common in Gothic cathedrals.' },
        { question: 'What architectural style is the Parthenon?', options: ['Classical Greek', 'Roman', 'Gothic', 'Baroque'], correctAnswer: 'Classical Greek', explanation: 'The Parthenon exemplifies the Doric order of Classical Greek architecture.' },
        { question: 'What is CAD in architecture?', options: ['Computer-Aided Design', 'Creative Art Drawing', 'Controlled Architecture Development', 'Central Area Design'], correctAnswer: 'Computer-Aided Design', explanation: 'CAD software is used to create precise 2D and 3D architectural drawings.' },
        { question: 'What is a cantilever?', options: ['A beam supported at only one end', 'A type of column', 'A roof style', 'A wall material'], correctAnswer: 'A beam supported at only one end', explanation: 'Cantilevers project horizontally with support only on one side, like balconies.' },
        { question: 'What is sustainable architecture?', options: ['Design that minimizes environmental impact', 'Building only with wood', 'Ancient building methods', 'Temporary structures'], correctAnswer: 'Design that minimizes environmental impact', explanation: 'Sustainable architecture uses energy-efficient design, green materials, and renewable energy.' },
        { question: 'What is the Golden Ratio in design?', options: ['A mathematical proportion of approximately 1:1.618', 'A gold-colored material', 'A type of measurement', 'A building code'], correctAnswer: 'A mathematical proportion of approximately 1:1.618', explanation: 'The Golden Ratio is found throughout nature and is considered aesthetically pleasing in design.' },
        { question: 'What is a load-bearing wall?', options: ['A wall that supports structural weight above it', 'A decorative wall', 'An exterior wall only', 'A temporary partition'], correctAnswer: 'A wall that supports structural weight above it', explanation: 'Removing a load-bearing wall without proper support can cause structural collapse.' },
        { question: 'Who designed the Eiffel Tower?', options: ['Gustave Eiffel', 'Le Corbusier', 'Antoni Gaudi', 'Louis Sullivan'], correctAnswer: 'Gustave Eiffel', explanation: 'Gustave Eiffel\'s company designed and built the tower for the 1889 World\'s Fair in Paris.' },
        { question: 'What is Art Deco architecture?', options: ['Decorative style from the 1920s-30s with geometric forms', 'Ancient Greek style', 'Minimalist modern style', 'Medieval building style'], correctAnswer: 'Decorative style from the 1920s-30s with geometric forms', explanation: 'Art Deco features bold geometry, rich colors, and lavish ornamentation.' },
        { question: 'What is urban planning?', options: ['Design and organization of urban spaces', 'Building skyscrapers', 'Interior design', 'Road construction'], correctAnswer: 'Design and organization of urban spaces', explanation: 'Urban planning manages land use, transportation, and community development in cities.' },
        { question: 'What is a foundation in construction?', options: ['The base structure that supports a building', 'The roof of a building', 'The walls of a building', 'The interior of a building'], correctAnswer: 'The base structure that supports a building', explanation: 'Foundations transfer building loads to the ground and prevent settlement.' },
        { question: 'What is a blueprint?', options: ['A detailed technical drawing of a building plan', 'A type of paint', 'A building material', 'A construction tool'], correctAnswer: 'A detailed technical drawing of a building plan', explanation: 'Blueprints show the layout, dimensions, and specifications of a building.' },
        { question: 'What is Bauhaus?', options: ['A German art and design school/movement', 'A type of building', 'A construction company', 'A building material'], correctAnswer: 'A German art and design school/movement', explanation: 'Bauhaus (1919-1933) revolutionized art, design, and architecture with functional modernism.' },
        { question: 'What is LEED certification?', options: ['Green building rating system', 'A type of building material', 'An architectural license', 'A construction permit'], correctAnswer: 'Green building rating system', explanation: 'LEED rates buildings on energy efficiency, sustainability, and environmental design.' },
    ],
    'education': [
        { question: 'What is pedagogy?', options: ['The method and practice of teaching', 'The study of children', 'A type of school', 'An educational degree'], correctAnswer: 'The method and practice of teaching', explanation: 'Pedagogy encompasses theories, methods, and strategies of instruction.' },
        { question: 'Who developed the theory of multiple intelligences?', options: ['Howard Gardner', 'Jean Piaget', 'Lev Vygotsky', 'John Dewey'], correctAnswer: 'Howard Gardner', explanation: 'Gardner proposed 8 types of intelligence including linguistic, musical, and spatial.' },
        { question: 'What is scaffolding in education?', options: ['Providing temporary support until learners can work independently', 'Building school structures', 'Testing students', 'Grading assignments'], correctAnswer: 'Providing temporary support until learners can work independently', explanation: 'Scaffolding breaks complex tasks into manageable steps with gradual support removal.' },
        { question: 'What is Bloom\'s Taxonomy?', options: ['A framework for classifying learning objectives', 'A type of flower study', 'A grading system', 'A school ranking'], correctAnswer: 'A framework for classifying learning objectives', explanation: 'Bloom\'s Taxonomy ranks cognitive skills from remembering to creating.' },
        { question: 'What is differentiated instruction?', options: ['Tailoring teaching to different learning needs', 'Teaching the same way to everyone', 'Only teaching advanced students', 'Separating students by ability'], correctAnswer: 'Tailoring teaching to different learning needs', explanation: 'Differentiation adjusts content, process, and products to meet diverse learner needs.' },
        { question: 'What is formative assessment?', options: ['Ongoing assessment during learning', 'Final exam', 'Entrance test', 'Standardized test'], correctAnswer: 'Ongoing assessment during learning', explanation: 'Formative assessment monitors student progress and informs instruction adjustments.' },
        { question: 'Who is known as the father of modern education?', options: ['John Dewey', 'Aristotle', 'Confucius', 'Plato'], correctAnswer: 'John Dewey', explanation: 'Dewey advocated for experiential learning and democratic education principles.' },
        { question: 'What is a curriculum?', options: ['The planned content and learning experiences in a course', 'A textbook', 'A classroom', 'A teaching degree'], correctAnswer: 'The planned content and learning experiences in a course', explanation: 'A curriculum outlines what students should learn, how, and how learning is assessed.' },
        { question: 'What is inclusive education?', options: ['Education that accommodates all learners including those with disabilities', 'Education only for gifted students', 'Online-only education', 'Private education'], correctAnswer: 'Education that accommodates all learners including those with disabilities', explanation: 'Inclusive education ensures all students can participate meaningfully in learning.' },
        { question: 'What is the Zone of Proximal Development?', options: ['The gap between what a learner can do alone vs with help', 'A physical area in school', 'A testing zone', 'A grade level'], correctAnswer: 'The gap between what a learner can do alone vs with help', explanation: 'Vygotsky\'s ZPD identifies the sweet spot for learning with appropriate support.' },
        { question: 'What is project-based learning?', options: ['Learning through completing real-world projects', 'Only doing homework', 'Memorizing textbooks', 'Taking standardized tests'], correctAnswer: 'Learning through completing real-world projects', explanation: 'PBL engages students in solving authentic problems over an extended period.' },
        { question: 'What is a learning disability?', options: ['A neurological condition affecting specific learning skills', 'Low intelligence', 'Laziness', 'A temporary illness'], correctAnswer: 'A neurological condition affecting specific learning skills', explanation: 'Learning disabilities like dyslexia affect how the brain processes information.' },
        { question: 'What is STEM education?', options: ['Science, Technology, Engineering, and Mathematics', 'Standardized Testing and Evaluation Methods', 'Student Teacher Education Model', 'Strategic Teaching Enhancement Methodology'], correctAnswer: 'Science, Technology, Engineering, and Mathematics', explanation: 'STEM education integrates these four disciplines to prepare students for technical careers.' },
        { question: 'What is flipped classroom?', options: ['Students learn content at home and practice in class', 'Rearranging classroom furniture', 'Teaching in reverse order', 'Students teaching teachers'], correctAnswer: 'Students learn content at home and practice in class', explanation: 'Flipped classrooms use class time for active learning and application rather than lectures.' },
        { question: 'What is constructivism?', options: ['Learning theory where learners build knowledge through experience', 'Teaching by direct instruction only', 'Building physical models', 'A type of school'], correctAnswer: 'Learning theory where learners build knowledge through experience', explanation: 'Constructivism holds that learners actively construct understanding rather than passively receiving it.' },
    ],
    'sports': [
        { question: 'What is VO2 max?', options: ['Maximum rate of oxygen consumption during exercise', 'A vitamin supplement', 'A type of exercise machine', 'A breathing technique'], correctAnswer: 'Maximum rate of oxygen consumption during exercise', explanation: 'VO2 max measures aerobic fitness and is a key indicator of cardiovascular endurance.' },
        { question: 'What is the anaerobic threshold?', options: ['The intensity where lactate builds up faster than it can be removed', 'Maximum heart rate', 'Resting heart rate', 'Recovery time'], correctAnswer: 'The intensity where lactate builds up faster than it can be removed', explanation: 'Beyond this threshold, exercise cannot be sustained for long periods.' },
        { question: 'What is periodization in training?', options: ['Systematic planning of athletic training in cycles', 'Training at the same intensity always', 'Only training once a week', 'Resting between seasons'], correctAnswer: 'Systematic planning of athletic training in cycles', explanation: 'Periodization varies training intensity and volume to optimize performance and recovery.' },
        { question: 'Which muscle is the largest in the human body?', options: ['Gluteus maximus', 'Biceps', 'Quadriceps', 'Deltoids'], correctAnswer: 'Gluteus maximus', explanation: 'The gluteus maximus is the largest and most powerful muscle, essential for hip extension.' },
        { question: 'What is BMI?', options: ['Body Mass Index', 'Basic Muscle Indicator', 'Body Movement Index', 'Bone Mineral Intensity'], correctAnswer: 'Body Mass Index', explanation: 'BMI is calculated from weight and height to screen for weight categories.' },
        { question: 'What is DOMS?', options: ['Delayed Onset Muscle Soreness', 'Daily Optimized Movement System', 'Dynamic Overload Muscle Stimulus', 'Direct Output Measurement Scale'], correctAnswer: 'Delayed Onset Muscle Soreness', explanation: 'DOMS is muscle pain that occurs 24-72 hours after unaccustomed exercise.' },
        { question: 'What is the purpose of a warm-up?', options: ['Prepare the body for exercise and prevent injury', 'Burn maximum calories', 'Build muscle', 'Improve flexibility only'], correctAnswer: 'Prepare the body for exercise and prevent injury', explanation: 'Warm-ups increase blood flow, heart rate, and muscle temperature gradually.' },
        { question: 'What is hypertrophy?', options: ['Increase in muscle size', 'Decrease in muscle size', 'Increase in flexibility', 'Bone growth'], correctAnswer: 'Increase in muscle size', explanation: 'Muscle hypertrophy occurs through resistance training that causes muscle fiber growth.' },
        { question: 'What does RPE stand for?', options: ['Rate of Perceived Exertion', 'Repetitions Per Exercise', 'Rest Period Extension', 'Rapid Performance Enhancement'], correctAnswer: 'Rate of Perceived Exertion', explanation: 'RPE is a subjective scale (1-10) measuring how hard exercise feels.' },
        { question: 'What is the recommended daily water intake for athletes?', options: ['At least 3-4 liters', '1 liter', '500ml', '8 liters'], correctAnswer: 'At least 3-4 liters', explanation: 'Athletes need more water due to fluid lost through sweat during training.' },
        { question: 'What is plyometric training?', options: ['Explosive jump-based exercises', 'Slow stretching', 'Long-distance running', 'Weight lifting only'], correctAnswer: 'Explosive jump-based exercises', explanation: 'Plyometrics use rapid stretching and contracting of muscles to build power.' },
        { question: 'What is proprioception?', options: ['Awareness of body position in space', 'A type of exercise', 'A muscle group', 'A nutrition plan'], correctAnswer: 'Awareness of body position in space', explanation: 'Proprioception helps maintain balance, coordination, and movement control.' },
        { question: 'What macronutrient is most important for muscle repair?', options: ['Protein', 'Carbohydrates', 'Fats', 'Fiber'], correctAnswer: 'Protein', explanation: 'Protein provides amino acids needed to repair and build muscle tissue after exercise.' },
        { question: 'What is interval training?', options: ['Alternating periods of high and low intensity exercise', 'Training at constant speed', 'Only resting between sets', 'Training once a week'], correctAnswer: 'Alternating periods of high and low intensity exercise', explanation: 'Interval training improves both aerobic and anaerobic fitness efficiently.' },
        { question: 'What is the role of tendons?', options: ['Connect muscle to bone', 'Connect bone to bone', 'Produce blood cells', 'Store fat'], correctAnswer: 'Connect muscle to bone', explanation: 'Tendons transmit the force of muscle contraction to bones to produce movement.' },
    ],
    'music': [
        { question: 'How many keys does a standard piano have?', options: ['88', '76', '64', '92'], correctAnswer: '88', explanation: 'A standard piano has 88 keys: 52 white and 36 black.' },
        { question: 'What does "forte" mean in music?', options: ['Loud', 'Soft', 'Fast', 'Slow'], correctAnswer: 'Loud', explanation: 'Forte (f) indicates a passage should be played loudly.' },
        { question: 'What is a chord?', options: ['Three or more notes played simultaneously', 'A single note', 'A type of instrument', 'A rhythm pattern'], correctAnswer: 'Three or more notes played simultaneously', explanation: 'Chords form the harmonic foundation of most Western music.' },
        { question: 'Who composed the "Moonlight Sonata"?', options: ['Ludwig van Beethoven', 'Wolfgang Mozart', 'Johann Bach', 'Frederic Chopin'], correctAnswer: 'Ludwig van Beethoven', explanation: 'Beethoven composed Piano Sonata No. 14 (Moonlight) in 1801.' },
        { question: 'What is tempo?', options: ['The speed of music', 'The volume of music', 'The pitch of music', 'The key of music'], correctAnswer: 'The speed of music', explanation: 'Tempo is measured in BPM (beats per minute) and determines how fast music is played.' },
        { question: 'What is an octave?', options: ['The interval between one note and the same note at double the frequency', 'Eight different notes', 'A type of instrument', 'A musical style'], correctAnswer: 'The interval between one note and the same note at double the frequency', explanation: 'An octave spans 8 notes in a scale, with the higher note vibrating at twice the frequency.' },
        { question: 'What is syncopation?', options: ['Placing emphasis on normally weak beats', 'Playing very loudly', 'Playing very slowly', 'Using only one instrument'], correctAnswer: 'Placing emphasis on normally weak beats', explanation: 'Syncopation creates rhythmic surprise by stressing unexpected beats.' },
        { question: 'What is a time signature?', options: ['Notation indicating beats per measure', 'A musician\'s autograph', 'A type of tempo', 'A musical key'], correctAnswer: 'Notation indicating beats per measure', explanation: 'Common time signatures include 4/4, 3/4, and 6/8.' },
        { question: 'What genre originated in New Orleans?', options: ['Jazz', 'Country', 'Rock', 'Classical'], correctAnswer: 'Jazz', explanation: 'Jazz emerged in New Orleans in the late 19th and early 20th centuries.' },
        { question: 'What is a crescendo?', options: ['Gradually getting louder', 'Gradually getting softer', 'Getting faster', 'Getting slower'], correctAnswer: 'Gradually getting louder', explanation: 'A crescendo builds intensity by increasing volume over a passage.' },
        { question: 'What is harmony in music?', options: ['Multiple notes sounding simultaneously', 'A single melody line', 'The rhythm of music', 'The speed of music'], correctAnswer: 'Multiple notes sounding simultaneously', explanation: 'Harmony adds depth to melody through chords and accompaniment.' },
        { question: 'What is a treble clef?', options: ['A symbol for higher-pitched notes', 'A symbol for lower-pitched notes', 'A type of instrument', 'A musical genre'], correctAnswer: 'A symbol for higher-pitched notes', explanation: 'The treble clef (G clef) is used for notes above middle C on the staff.' },
        { question: 'What is improvisation in music?', options: ['Creating music spontaneously in real time', 'Reading sheet music exactly', 'Practicing scales', 'Recording in a studio'], correctAnswer: 'Creating music spontaneously in real time', explanation: 'Improvisation is a key element of jazz and many other musical traditions.' },
        { question: 'What BPM range is considered "Allegro"?', options: ['120-156 BPM', '40-60 BPM', '60-80 BPM', '200+ BPM'], correctAnswer: '120-156 BPM', explanation: 'Allegro means fast and lively, typically between 120-156 beats per minute.' },
        { question: 'What is a minor key generally associated with?', options: ['Sad or dark mood', 'Happy or bright mood', 'Neutral mood', 'Angry mood'], correctAnswer: 'Sad or dark mood', explanation: 'Minor keys tend to sound melancholic or serious compared to the brighter sound of major keys.' },
    ],
    'environmental': [
        { question: 'What is the greenhouse effect?', options: ['Trapping of heat in Earth\'s atmosphere by gases', 'Growing plants in greenhouses', 'A type of pollution', 'Ozone depletion'], correctAnswer: 'Trapping of heat in Earth\'s atmosphere by gases', explanation: 'Greenhouse gases like CO2 and methane trap heat, warming the planet.' },
        { question: 'What is biodiversity?', options: ['Variety of life forms in an ecosystem', 'A type of energy', 'A type of pollution', 'A conservation method'], correctAnswer: 'Variety of life forms in an ecosystem', explanation: 'High biodiversity indicates a healthy, resilient ecosystem.' },
        { question: 'What is the main cause of climate change?', options: ['Burning fossil fuels', 'Volcanic eruptions', 'Solar flares', 'Deforestation only'], correctAnswer: 'Burning fossil fuels', explanation: 'Fossil fuel combustion releases CO2, the primary driver of human-caused climate change.' },
        { question: 'What is an ecosystem?', options: ['A community of organisms interacting with their environment', 'A type of energy', 'A government policy', 'A recycling program'], correctAnswer: 'A community of organisms interacting with their environment', explanation: 'Ecosystems include all living things and their physical environment functioning together.' },
        { question: 'What is renewable energy?', options: ['Energy from sources that are naturally replenished', 'Energy from coal', 'Nuclear energy', 'Energy stored in batteries'], correctAnswer: 'Energy from sources that are naturally replenished', explanation: 'Solar, wind, hydro, and geothermal are renewable energy sources.' },
        { question: 'What is deforestation?', options: ['Clearing of forests for other uses', 'Planting new trees', 'Forest conservation', 'Natural forest fires'], correctAnswer: 'Clearing of forests for other uses', explanation: 'Deforestation destroys habitats and releases stored carbon into the atmosphere.' },
        { question: 'What is the ozone layer?', options: ['A layer of O3 gas that protects from UV radiation', 'A type of cloud', 'The outer edge of space', 'A type of pollution'], correctAnswer: 'A layer of O3 gas that protects from UV radiation', explanation: 'The ozone layer in the stratosphere absorbs most of the Sun\'s harmful ultraviolet radiation.' },
        { question: 'What is carbon footprint?', options: ['Total greenhouse gas emissions by a person or organization', 'A fossil imprint', 'A type of fuel', 'A measurement of walking distance'], correctAnswer: 'Total greenhouse gas emissions by a person or organization', explanation: 'Carbon footprint measures the total CO2-equivalent emissions from activities.' },
        { question: 'What is water pollution?', options: ['Contamination of water bodies with harmful substances', 'Water evaporation', 'Water treatment', 'Natural water flow'], correctAnswer: 'Contamination of water bodies with harmful substances', explanation: 'Water pollution from chemicals, waste, and runoff harms aquatic life and human health.' },
        { question: 'What percentage of Earth is covered by water?', options: ['71%', '50%', '85%', '60%'], correctAnswer: '71%', explanation: 'About 71% of Earth\'s surface is water, but only 2.5% is freshwater.' },
        { question: 'What is sustainability?', options: ['Meeting present needs without compromising future generations', 'Using all resources now', 'Only using renewable energy', 'Stopping all development'], correctAnswer: 'Meeting present needs without compromising future generations', explanation: 'Sustainability balances economic, social, and environmental needs for long-term well-being.' },
        { question: 'What is an endangered species?', options: ['A species at risk of extinction', 'An invasive species', 'A common species', 'A domestic animal'], correctAnswer: 'A species at risk of extinction', explanation: 'Endangered species face threats from habitat loss, hunting, pollution, or climate change.' },
        { question: 'What is the Paris Agreement?', options: ['International treaty to limit global warming', 'A trade agreement', 'A peace treaty', 'An environmental tax'], correctAnswer: 'International treaty to limit global warming', explanation: 'The 2015 Paris Agreement aims to keep global warming below 2°C above pre-industrial levels.' },
        { question: 'What is composting?', options: ['Decomposing organic waste into fertilizer', 'Burning waste', 'Burying plastic', 'Chemical waste treatment'], correctAnswer: 'Decomposing organic waste into fertilizer', explanation: 'Composting reduces landfill waste while creating nutrient-rich soil amendment.' },
        { question: 'What is an invasive species?', options: ['Non-native species that causes harm to an ecosystem', 'An endangered species', 'A native species', 'A domesticated animal'], correctAnswer: 'Non-native species that causes harm to an ecosystem', explanation: 'Invasive species can outcompete native species, disrupt food chains, and damage habitats.' },
    ],
};
class StudyBuddyService {
    /**
     * Get all available categories
     */
    getCategories() {
        return CATEGORIES;
    }
    /**
     * Find study buddies based on category and user occupation matching
     */
    async findStudyBuddies(userId, category) {
        try {
            if (!QUESTION_BANK[category]) {
                throw new Error('Invalid category');
            }
            const keywords = CATEGORY_KEYWORDS[category];
            // For 'general' or if no keywords, show all active users
            const isGeneral = category === 'general' || !keywords;
            const regexPattern = keywords ? keywords.map(k => `\\b${k}\\b`).join('|') : '.*';
            const regex = new RegExp(regexPattern, 'i');
            const query = {
                _id: { $ne: userId },
                isActive: true,
            };
            // For general, show all users; for specific categories, filter by occupation
            if (!isGeneral) {
                query.occupation = { $regex: regex };
                if (category === 'engineering') {
                    query.occupation.$not = /software/i;
                }
            }
            const buddies = await User_1.User.find(query)
                .select('firstName lastName profilePhoto occupation')
                .limit(20)
                .lean();
            return buddies;
        }
        catch (error) {
            logger_1.default.error('Find study buddies error:', error);
            throw new Error(error.message || 'Failed to find study buddies');
        }
    }
    /**
     * Create a solo study session
     */
    async createSoloSession(userId, category, questionCount = 10) {
        try {
            const count = Math.min(Math.max(questionCount, 5), 20); // 5-20 questions
            const questions = await this.getRandomQuestions(category, count);
            if (!questions.length) {
                throw new Error('No questions available for this category');
            }
            const session = await StudyBuddy_1.StudySession.create({
                creator: userId,
                category,
                mode: 'solo',
                status: 'active',
                questions,
                totalQuestions: count,
                timeLimit: 30,
                startedAt: new Date(),
            });
            return session;
        }
        catch (error) {
            logger_1.default.error('Create solo session error:', error);
            throw new Error(error.message || 'Failed to create solo session');
        }
    }
    /**
     * Create a challenge session against another user
     */
    async createChallengeSession(userId, opponentId, category, questionCount = 10) {
        try {
            const count = Math.min(Math.max(questionCount, 5), 20);
            const questions = await this.getRandomQuestions(category, count);
            if (!questions.length) {
                throw new Error('No questions available for this category');
            }
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5);
            const session = await StudyBuddy_1.StudySession.create({
                creator: userId,
                opponent: opponentId,
                category,
                mode: 'challenge',
                status: 'pending',
                questions,
                totalQuestions: 10,
                timeLimit: 30,
                expiresAt,
            });
            return session;
        }
        catch (error) {
            logger_1.default.error('Create challenge session error:', error);
            throw new Error(error.message || 'Failed to create challenge session');
        }
    }
    /**
     * Respond to a challenge invitation
     */
    async respondToChallenge(sessionId, userId, accept) {
        try {
            const session = await StudyBuddy_1.StudySession.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            if (session.opponent?.toString() !== userId) {
                throw new Error('You are not the opponent of this session');
            }
            if (session.status !== 'pending') {
                throw new Error('This challenge is no longer pending');
            }
            if (session.expiresAt && new Date() > session.expiresAt) {
                session.status = 'cancelled';
                await session.save();
                throw new Error('This challenge has expired');
            }
            if (accept) {
                session.status = 'active';
                session.startedAt = new Date();
            }
            else {
                session.status = 'declined';
            }
            await session.save();
            return session;
        }
        catch (error) {
            logger_1.default.error('Respond to challenge error:', error);
            throw new Error(error.message || 'Failed to respond to challenge');
        }
    }
    /**
     * Submit answers for a session
     */
    async submitAnswers(sessionId, userId, answers) {
        try {
            const session = await StudyBuddy_1.StudySession.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            if (session.status !== 'active') {
                throw new Error('Session is not active');
            }
            const isCreator = session.creator.toString() === userId;
            const isOpponent = session.opponent?.toString() === userId;
            if (!isCreator && !isOpponent) {
                throw new Error('You are not a participant in this session');
            }
            // Score the answers
            const scoredAnswers = answers.map(a => {
                const question = session.questions[a.questionIndex];
                const correct = question ? question.correctAnswer === a.answer : false;
                return {
                    questionIndex: a.questionIndex,
                    answer: a.answer,
                    correct,
                    timeSpent: a.timeSpent,
                };
            });
            // Calculate score: 100 base + time bonus (max 50 based on speed) per correct answer
            const score = scoredAnswers.reduce((total, a) => {
                if (a.correct) {
                    const timeBonus = Math.max(0, Math.floor(50 * (1 - a.timeSpent / session.timeLimit)));
                    return total + 100 + timeBonus;
                }
                return total;
            }, 0);
            if (isCreator) {
                session.creatorAnswers = scoredAnswers;
                session.creatorScore = score;
            }
            else {
                session.opponentAnswers = scoredAnswers;
                session.opponentScore = score;
            }
            // Check if session should be completed
            const creatorDone = session.creatorAnswers.length > 0;
            const opponentDone = session.mode === 'solo' || session.opponentAnswers.length > 0;
            if (creatorDone && opponentDone) {
                session.status = 'completed';
                session.completedAt = new Date();
                const correctCount = scoredAnswers.filter(a => a.correct).length;
                const isPerfect = correctCount === session.totalQuestions;
                if (session.mode === 'solo') {
                    // No points for solo — it's just practice
                }
                else if (session.mode === 'challenge') {
                    if (session.creatorScore > session.opponentScore) {
                        session.winner = session.creator;
                    }
                    else if (session.opponentScore > session.creatorScore) {
                        session.winner = session.opponent;
                    }
                    // Award points to both players
                    const winnerId = session.winner?.toString();
                    const loserId = winnerId === session.creator.toString() ? session.opponent?.toString() : session.creator.toString();
                    try {
                        if (winnerId) {
                            await points_service_1.default.addPoints({
                                userId: winnerId,
                                amount: STUDY_POINTS.challengeWin,
                                type: 'game_reward',
                                reason: `Won study challenge in ${session.category}`,
                                metadata: { sessionId: session._id },
                            });
                        }
                        if (loserId) {
                            await points_service_1.default.addPoints({
                                userId: loserId,
                                amount: STUDY_POINTS.challengeLoser,
                                type: 'game_reward',
                                reason: `Completed study challenge in ${session.category}`,
                                metadata: { sessionId: session._id },
                            });
                        }
                        if (!winnerId) {
                            // Tie — both get moderate points
                            for (const uid of [session.creator.toString(), session.opponent?.toString()].filter(Boolean)) {
                                await points_service_1.default.addPoints({
                                    userId: uid,
                                    amount: 10,
                                    type: 'game_reward',
                                    reason: `Tied study challenge in ${session.category}`,
                                    metadata: { sessionId: session._id },
                                });
                            }
                        }
                    }
                    catch (e) {
                        logger_1.default.warn('Failed to award challenge points:', e);
                    }
                }
            }
            await session.save();
            return session;
        }
        catch (error) {
            logger_1.default.error('Submit answers error:', error);
            throw new Error(error.message || 'Failed to submit answers');
        }
    }
    /**
     * Get a session by ID with populated fields
     */
    async getSession(sessionId) {
        try {
            const session = await StudyBuddy_1.StudySession.findById(sessionId)
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('opponent', 'firstName lastName profilePhoto')
                .populate('winner', 'firstName lastName profilePhoto');
            if (!session) {
                throw new Error('Session not found');
            }
            return session;
        }
        catch (error) {
            logger_1.default.error('Get session error:', error);
            throw new Error(error.message || 'Failed to get session');
        }
    }
    /**
     * Get user's session history
     */
    async getUserHistory(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [sessions, total] = await Promise.all([
                StudyBuddy_1.StudySession.find({
                    $or: [{ creator: userId }, { opponent: userId }],
                })
                    .populate('creator', 'firstName lastName profilePhoto')
                    .populate('opponent', 'firstName lastName profilePhoto')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                StudyBuddy_1.StudySession.countDocuments({
                    $or: [{ creator: userId }, { opponent: userId }],
                }),
            ]);
            return {
                sessions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('Get user history error:', error);
            throw new Error(error.message || 'Failed to get user history');
        }
    }
    /**
     * Get leaderboard for a category
     */
    async getLeaderboard(category, limit = 20) {
        try {
            const query = { status: 'completed' };
            if (category && category !== 'all') {
                query.category = category;
            }
            const leaderboard = await StudyBuddy_1.StudySession.aggregate([
                { $match: query },
                {
                    $facet: {
                        creators: [
                            { $group: { _id: '$creator', totalScore: { $sum: '$creatorScore' }, sessionsPlayed: { $sum: 1 } } },
                        ],
                        opponents: [
                            { $match: { opponent: { $exists: true } } },
                            { $group: { _id: '$opponent', totalScore: { $sum: '$opponentScore' }, sessionsPlayed: { $sum: 1 } } },
                        ],
                    },
                },
                {
                    $project: {
                        combined: { $concatArrays: ['$creators', '$opponents'] },
                    },
                },
                { $unwind: '$combined' },
                {
                    $group: {
                        _id: '$combined._id',
                        totalScore: { $sum: '$combined.totalScore' },
                        sessionsPlayed: { $sum: '$combined.sessionsPlayed' },
                    },
                },
                { $sort: { totalScore: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        totalScore: 1,
                        sessionsPlayed: 1,
                        'user.firstName': 1,
                        'user.lastName': 1,
                        'user.profilePhoto': 1,
                    },
                },
            ]);
            return leaderboard;
        }
        catch (error) {
            logger_1.default.error('Get leaderboard error:', error);
            throw new Error(error.message || 'Failed to get leaderboard');
        }
    }
    /**
     * Pick random questions from the question bank
     */
    async getRandomQuestions(category, count) {
        // Combine hardcoded + DB questions
        const hardcoded = QUESTION_BANK[category] || [];
        let dbQuestions = [];
        try {
            const { StudyQuestion } = require('../models');
            dbQuestions = await StudyQuestion.find({ category, isActive: true }).lean();
        }
        catch (e) { }
        const allQuestions = [
            ...hardcoded,
            ...dbQuestions.map((q) => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
            })),
        ];
        if (allQuestions.length === 0)
            return [];
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(count, shuffled.length));
        // Shuffle options within each question
        return picked.map(q => {
            const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
            return { ...q, options: shuffledOptions };
        });
    }
}
exports.default = new StudyBuddyService();
//# sourceMappingURL=studyBuddy.service.js.map