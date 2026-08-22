/* ==========================================================================
   StudyFlow — Class & Education Level Presets
   Complete catalog of 20 classes/levels with tailored default subjects,
   chapters, tasks, recommended study sessions, exams, and notes.
   ========================================================================== */

window.StudyFlow = window.StudyFlow || {};

(function () {
  'use strict';

  function pad2(n) { return String(n).padStart(2, '0'); }

  function isoDays(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function isoOffset(days, hours, mins) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hours, mins, 0, 0);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' +
      pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  const CATEGORIES = {
    EARLY: 'Early Childhood',
    PRIMARY: 'Primary School (1–5)',
    MIDDLE: 'Middle School (6–8)',
    SECONDARY: 'High School (9–10)',
    SENIOR: 'Senior Secondary (11–12)',
    HIGHER: 'Higher Education & Professional'
  };

  const PRESETS = {
    'nursery': {
      id: 'nursery',
      name: 'Nursery',
      category: CATEGORIES.EARLY,
      categoryKey: 'early',
      badge: 'Kindergarten',
      icon: 'sparkles',
      description: 'Foundational rhymes, phonics, numbers, shapes, and sensory play.',
      dailyGoal: 45,
      focusDefault: 15,
      breakDefault: 5,
      subjects: [
        {
          name: 'English Rhymes & Phonics',
          color: '#ec4899',
          icon: 'music',
          target: 90,
          chapters: ['Alphabet Sounds (A–M)', 'Alphabet Sounds (N–Z)', 'Nursery Rhymes & Songs', 'Picture Word Reading', 'Story Time Listening']
        },
        {
          name: 'Numbers & Shapes',
          color: '#f59e0b',
          icon: 'math',
          target: 85,
          chapters: ['Counting 1 to 10', 'Primary Shapes (Circle, Square, Triangle)', 'Big vs Small / Tall vs Short', 'Object Matching', 'Pattern Recognition']
        },
        {
          name: 'Colors & Creative Art',
          color: '#8b5cf6',
          icon: 'target',
          target: 85,
          chapters: ['Primary Colors (Red, Blue, Yellow)', 'Secondary Colors', 'Finger Painting & Scribbling', 'Clay Modeling Basics', 'Tracing Lines & Curves']
        },
        {
          name: 'General Awareness & Habits',
          color: '#10b981',
          icon: 'compass',
          target: 80,
          chapters: ['My Body Parts', 'Fruits & Vegetables', 'Animals & Sounds', 'Good Morning & Golden Words', 'Cleanliness & Sharing']
        }
      ],
      tasks: [
        { title: 'Practice phonics letter sounds A–G', description: 'Listen and repeat rhymes with flashcards.', category: 'Practice', priority: 'High', daysOffset: 1 },
        { title: 'Color the animal picture book', description: 'Color the lion and elephant using primary colors.', category: 'Homework', priority: 'Medium', daysOffset: 2 },
        { title: 'Count building blocks 1 to 10', description: 'Stack blocks and count aloud together.', category: 'Practice', priority: 'Medium', daysOffset: 3 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Letter sounds & A-Z songs', dayOffset: 0, startH: 9, startM: 30, endH: 10, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Counting blocks 1 to 10', dayOffset: 0, startH: 16, startM: 0, endH: 16, endM: 30, priority: 'Medium', completed: false },
        { subjectIndex: 2, topic: 'Finger painting shapes', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 30, priority: 'Medium', completed: false },
        { subjectIndex: 3, topic: 'Animals & Birds picture cards', dayOffset: -1, startH: 11, startM: 0, endH: 11, endM: 30, priority: 'Low', completed: true }
      ],
      exams: [
        { name: 'Phonics & Rhymes Show', subjectIndex: 0, daysOffset: 5, description: 'Recite favourite rhymes and identify phonics flashcards.' },
        { name: 'Numbers & Colors Fun Test', subjectIndex: 1, daysOffset: 12, description: 'Count objects up to 10 and identify primary colors.' }
      ],
      notes: [
        { title: 'Daily Nursery Routine', subjectIndex: 0, content: '1. 15 mins Phonics & Songs\n2. 15 mins Counting Blocks\n3. 15 mins Creative Coloring\nAlways keep it playful and visual!', pinned: true }
      ]
    },

    'lkg': {
      id: 'lkg',
      name: 'LKG (Lower KG)',
      category: CATEGORIES.EARLY,
      categoryKey: 'early',
      badge: 'Kindergarten',
      icon: 'sparkles',
      description: 'Capital and small alphabet, numbers 1 to 20, nature, and guided drawing.',
      dailyGoal: 60,
      focusDefault: 20,
      breakDefault: 5,
      subjects: [
        {
          name: 'English Letters & Words',
          color: '#6366f1',
          icon: 'book',
          target: 90,
          chapters: ['Capital Letters A–Z', 'Small Letters a–z', 'Sight Words (Cat, Dog, Sun, Bat)', 'Missing Letters Practice', 'Rhymes & Story Telling']
        },
        {
          name: 'Early Math & Counting',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['Numbers 1 to 20', 'Before, After & Between Numbers', 'More vs Less', 'Basic Shapes & Geometry', 'Simple Picture Addition']
        },
        {
          name: 'Environmental Science (EVS)',
          color: '#10b981',
          icon: 'atom',
          target: 80,
          chapters: ['My Family & Home', 'Our Neighbourhood Helpers', 'Seasons & Weather', 'Plants, Trees & Flowers', 'Safe Habits & Road Safety']
        },
        {
          name: 'Art & Expression',
          color: '#f59e0b',
          icon: 'layout',
          target: 85,
          chapters: ['Coloring within Lines', 'Pattern Tracing & Mazes', 'Paper Folding (Origami Basics)', 'Connecting the Dots 1–20']
        }
      ],
      tasks: [
        { title: 'Write small letters a to m', description: 'Practice on 4-line notebook page 12.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Count and circle numbers 1 to 20', description: 'Worksheet 4 exercise questions.', category: 'Practice', priority: 'Medium', daysOffset: 2 },
        { title: 'Learn community helpers names', description: 'Doctor, Teacher, Firefighter, Policeman cards.', category: 'Revision', priority: 'Low', daysOffset: 3 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Small letters writing practice', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 30, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Numbers 1 to 20 sequencing', dayOffset: 0, startH: 15, startM: 0, endH: 15, endM: 30, priority: 'Medium', completed: false },
        { subjectIndex: 2, topic: 'Community helpers flashcards', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 30, priority: 'Low', completed: false }
      ],
      exams: [
        { name: 'LKG Mid-Term Assessment', subjectIndex: 0, daysOffset: 6, description: 'Alphabet identification, small letters tracing, rhymes recital.' },
        { name: 'Math & Shapes Activity', subjectIndex: 1, daysOffset: 14, description: 'Counting 1–20, shapes matching, picture addition.' }
      ],
      notes: [
        { title: 'LKG Focus Tips', subjectIndex: 0, content: 'Use tactile sand paper letters and audio songs for best letter retention.', pinned: true }
      ]
    },

    'ukg': {
      id: 'ukg',
      name: 'UKG (Upper KG)',
      category: CATEGORIES.EARLY,
      categoryKey: 'early',
      badge: 'Kindergarten',
      icon: 'sparkles',
      description: 'Sentence formation, simple addition/subtraction, EVS, and second language.',
      dailyGoal: 75,
      focusDefault: 20,
      breakDefault: 5,
      subjects: [
        {
          name: 'English & Phonics',
          color: '#6366f1',
          icon: 'book',
          target: 90,
          chapters: ['Vowels & Consonants', 'CVC 3-Letter Words', 'Sight Words & Short Sentences', 'Use of This/That & In/On/Under', 'Reading Comprehension Stories']
        },
        {
          name: 'Mathematics',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['Numbers 1 to 100', 'Number Names 1–50', 'Single-Digit Addition (+)', 'Single-Digit Subtraction (-)', 'Time Concepts (Morning/Night, Clock Basics)', 'Skip Counting by 2s & 5s']
        },
        {
          name: 'Environmental Studies',
          color: '#10b981',
          icon: 'atom',
          target: 85,
          chapters: ['Living vs Non-Living Things', 'Five Senses & Functions', 'Our Universe (Sun, Moon, Stars)', 'Water Cycle & Conservation', 'Transport & Vehicles']
        },
        {
          name: 'Second Language / Hindi',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Swar & Vyanjan Identification', '2-Letter Words', 'Matra Basics', 'Picture Reading']
        },
        {
          name: 'Art & General Knowledge',
          color: '#f59e0b',
          icon: 'layout',
          target: 80,
          chapters: ['Drawing Simple Objects', 'National Symbols & Festivals', 'Good Manners & Etiquette']
        }
      ],
      tasks: [
        { title: 'Read 3-letter CVC storybook', description: 'Read page 8 to 15 aloud.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Addition worksheet (1 to 10)', description: 'Solve 10 single digit additions with fingers or counters.', category: 'Practice', priority: 'High', daysOffset: 2 },
        { title: 'Draw and color the 5 sense organs', description: 'Eyes, Ears, Nose, Tongue, Skin on sketchbook.', category: 'Project', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Sight words & CVC practice', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 35, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Single-digit addition with counters', dayOffset: 0, startH: 15, startM: 30, endH: 16, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Living vs Non-living chart', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 30, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'UKG English Reading & Writing', subjectIndex: 0, daysOffset: 7, description: 'CVC words, vowels/consonants, short sentence formation.' },
        { name: 'Math Quiz (Addition & 1-100)', subjectIndex: 1, daysOffset: 10, description: 'Number names, single digit addition and subtraction.' }
      ],
      notes: [
        { title: 'Daily Sight Words List', subjectIndex: 0, content: 'the, and, you, that, was, for, are, with, his, they, at, be, this, have, from.', pinned: true }
      ]
    },

    'class-1': {
      id: 'class-1',
      name: 'Class 1',
      category: CATEGORIES.PRIMARY,
      categoryKey: 'primary',
      badge: 'Primary School',
      icon: 'book',
      description: 'Foundational English reading, Numbers 1–100, addition, subtraction, EVS, and computer basics.',
      dailyGoal: 90,
      focusDefault: 25,
      breakDefault: 5,
      subjects: [
        {
          name: 'English Grammar & Reader',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Nouns (Naming Words)', 'Singular & Plural', 'Verbs (Action Words)', 'Articles (A, An, The)', 'Reading Comprehension & Prose']
        },
        {
          name: 'Mathematics',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['Numbers 1 to 100 & Place Values', 'Addition up to 20', 'Subtraction up to 20', 'Shapes & Space', 'Measurement (Length & Weight)', 'Money & Coins']
        },
        {
          name: 'Environmental Studies (EVS)',
          color: '#10b981',
          icon: 'atom',
          target: 80,
          chapters: ['About Myself & Family', 'Food We Eat & Clothes We Wear', 'Home & School', 'Plants & Animals Kingdom', 'Air, Water & Weather']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Varnamala / Alphabet', 'Matras & 2-3 Letter Words', 'Simple Sentences', 'Short Poems']
        },
        {
          name: 'Computer Basics & GK',
          color: '#f59e0b',
          icon: 'code',
          target: 80,
          chapters: ['Computer: A Smart Machine', 'Parts of a Computer (Monitor, CPU, Mouse)', 'Using the Mouse & Keyboard', 'General Knowledge & Current Affairs']
        }
      ],
      tasks: [
        { title: 'English grammar exercises (Nouns)', description: 'Underline naming words in exercise 2.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Math subtraction practice (1 to 20)', description: 'Complete 15 workbook problems.', category: 'Practice', priority: 'High', daysOffset: 2 },
        { title: 'Draw parts of a plant in EVS notebook', description: 'Label root, stem, leaf, flower, fruit.', category: 'Assignment', priority: 'Medium', daysOffset: 3 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Naming words & Singular/Plural', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 40, priority: 'High', completed: false },
        { subjectIndex: 1, topic: '2-digit addition and place value', dayOffset: 0, startH: 16, startM: 0, endH: 16, endM: 45, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Plants and their parts', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 40, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Class 1 English Term Exam', subjectIndex: 0, daysOffset: 8, description: 'Grammar (Nouns, Articles), Spelling words, Reading.' },
        { name: 'Math Evaluation 1', subjectIndex: 1, daysOffset: 12, description: 'Addition, subtraction, numbers 1-100, basic shapes.' }
      ],
      notes: [
        { title: 'Key Grammar Rules', subjectIndex: 0, content: 'A is used before consonant sounds (a cat, a book).\nAn is used before vowel sounds (an apple, an elephant).', pinned: true }
      ]
    },

    'class-2': {
      id: 'class-2',
      name: 'Class 2',
      category: CATEGORIES.PRIMARY,
      categoryKey: 'primary',
      badge: 'Primary School',
      icon: 'book',
      description: '3-digit numbers, word problems, English composition, EVS, and computer literacy.',
      dailyGoal: 90,
      focusDefault: 25,
      breakDefault: 5,
      subjects: [
        {
          name: 'English Language & Literature',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Pronouns & Adjectives', 'Prepositions (In, On, Under, Behind)', 'Punctuation & Capital Letters', 'Story Writing & Comprehension', 'Poetry Recitation']
        },
        {
          name: 'Mathematics',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['3-Digit Numbers (up to 1000)', 'Addition with Carry-over', 'Subtraction with Borrowing', 'Multiplication Tables 2–10', 'Basic Division & Fractions', 'Time, Calendar & Money']
        },
        {
          name: 'Environmental Studies',
          color: '#10b981',
          icon: 'atom',
          target: 80,
          chapters: ['Our Internal & External Organs', 'Safety Rules & First Aid', 'Neighbourhood & Public Places', 'Plants & Animal Habitats', 'Sun, Moon, Stars & Earth']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Sentence Formation', 'Opposite Words & Synonyms', 'Gender & Numbers', 'Reading Comprehension']
        },
        {
          name: 'Computer Science',
          color: '#f59e0b',
          icon: 'code',
          target: 80,
          chapters: ['Role of Computers in Everyday Life', 'Input & Output Devices', 'MS Paint & Drawing Tools', 'Tux Paint Fun']
        }
      ],
      tasks: [
        { title: 'Learn multiplication tables 2 to 5', description: 'Recite and write tables in math notebook.', category: 'Practice', priority: 'High', daysOffset: 1 },
        { title: 'English essay: My Best Friend', description: 'Write 6-8 sentences with correct punctuation.', category: 'Homework', priority: 'Medium', daysOffset: 2 },
        { title: 'EVS safety rules project', description: 'List 5 safety rules at home and on road.', category: 'Project', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Adjectives & Describing words', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 45, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Multiplication tables & word problems', dayOffset: 0, startH: 16, startM: 0, endH: 16, endM: 45, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Math Term 1 Assessment', subjectIndex: 1, daysOffset: 7, description: '3-digit addition/subtraction, multiplication tables 2-6.' },
        { name: 'English Grammar & Spellings', subjectIndex: 0, daysOffset: 14, description: 'Adjectives, prepositions, reading unseen passage.' }
      ],
      notes: [
        { title: 'Multiplication Table Tricks', subjectIndex: 1, content: 'Multiplication is repeated addition: 3 x 4 = 4 + 4 + 4 = 12.', pinned: true }
      ]
    },

    'class-3': {
      id: 'class-3',
      name: 'Class 3',
      category: CATEGORIES.PRIMARY,
      categoryKey: 'primary',
      badge: 'Primary School',
      icon: 'book',
      description: 'Multiplication, division, parts of speech, living things, social studies, and coding basics.',
      dailyGoal: 105,
      focusDefault: 25,
      breakDefault: 5,
      subjects: [
        {
          name: 'English',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Nouns, Pronouns, Verbs & Adverbs', 'Tenses (Past, Present, Future)', 'Conjunctions & Prepositions', 'Paragraph & Letter Writing', 'Literature Stories']
        },
        {
          name: 'Mathematics',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['4-Digit Numbers & Place Value', 'Addition & Subtraction of Large Numbers', 'Multiplication (2 & 3 digit)', 'Division & Long Division Basics', 'Fractions Introduction', 'Geometry & Perimeter Basics', 'Data Handling & Pictographs']
        },
        {
          name: 'Science',
          color: '#10b981',
          icon: 'atom',
          target: 80,
          chapters: ['Living & Non-Living Characteristics', 'Parts of a Plant & Photosynthesis', 'Animals: Food & Feeding Habits', 'Human Body: Organ Systems', 'Birds: Beaks, Claws & Nests', 'Soil, Water & Air']
        },
        {
          name: 'Social Studies',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['The Earth: Our Home', 'Maps, Globes & Cardinal Directions', 'Our Country: India States & Capitals', 'Our National Symbols & Heritage', 'Means of Transport & Communication']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Vyakaran (Sangya, Sarvanam)', 'Patra Lekhan Basics', 'Kahani & Kavita', 'Shabd Kosh']
        },
        {
          name: 'Computer Science',
          color: '#8b5cf6',
          icon: 'code',
          target: 80,
          chapters: ['Hardware & Software Overview', 'Windows Desktop & File Basics', 'WordPad Formatting', 'Algorithms & Step-by-Step Logic']
        }
      ],
      tasks: [
        { title: 'Solve 10 long division sums', description: 'Page 44 exercises 1 to 10 in math book.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Science summary: Human organ systems', description: 'Digestive, respiratory, circulatory systems review.', category: 'Revision', priority: 'High', daysOffset: 2 },
        { title: 'Draw map of India with 4 cardinal directions', description: 'Label North, South, East, West and major states.', category: 'Assignment', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Tenses and sentence structure', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 45, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Long division & fractions', dayOffset: 0, startH: 15, startM: 30, endH: 16, endM: 15, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Organ systems & photosynthesis', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 45, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Mathematics Mid-Term', subjectIndex: 1, daysOffset: 9, description: '4-digit operations, division, fractions, perimeter.' },
        { name: 'Science Unit Test', subjectIndex: 2, daysOffset: 15, description: 'Organ systems, plant parts, feeding habits of animals.' }
      ],
      notes: [
        { title: 'Division Formula', subjectIndex: 1, content: 'Dividend = (Divisor x Quotient) + Remainder', pinned: true }
      ]
    },

    'class-4': {
      id: 'class-4',
      name: 'Class 4',
      category: CATEGORIES.PRIMARY,
      categoryKey: 'primary',
      badge: 'Primary School',
      icon: 'book',
      description: 'Fractions, decimals, states of matter, geography, Indian heritage, and block coding.',
      dailyGoal: 120,
      focusDefault: 25,
      breakDefault: 5,
      subjects: [
        {
          name: 'English',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Subject & Predicate', 'Types of Adverbs & Prepositions', 'Direct & Indirect Speech Basics', 'Informal Letter & Story Writing', 'Prose & Poetry Analysis']
        },
        {
          name: 'Mathematics',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['Large Numbers up to Lakhs / Millions', 'Factors & Multiples (HCF & LCM)', 'Fractions (Equivalent, Like, Unlike)', 'Decimals Introduction', 'Measurement & Metric Conversions', 'Perimeter & Area of Rectangles', 'Angles & Geometry']
        },
        {
          name: 'General Science',
          color: '#10b981',
          icon: 'atom',
          target: 80,
          chapters: ['Green Plants: Food Producers', 'Adaptations in Plants & Animals', 'Food & Digestion / Teeth & Microbes', 'Matter: Solids, Liquids & Gases', 'Force, Work & Energy', 'Solar System & Earth Movements']
        },
        {
          name: 'Social Studies',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['Northern Mountains & Plains of India', 'The Great Indian Desert & Southern Plateaus', 'Coastal Plains & Islands', 'Climate & Natural Vegetation', 'Our Mineral & Forest Resources', 'Our Rights & Duties (Civics)']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Kriya, Visheshan, Kaal', 'Muhavare & Vilom Shabd', 'Anuched Lekhan', 'Sahitya Path']
        },
        {
          name: 'Computer Science',
          color: '#8b5cf6',
          icon: 'code',
          target: 80,
          chapters: ['Memory & Storage Devices (RAM, ROM, SSD)', 'Editing in MS Word (Tables, Styles)', 'PowerPoint Presentation Basics', 'Intro to Scratch Coding & Loops']
        }
      ],
      tasks: [
        { title: 'Find HCF and LCM of 12, 18, 24', description: 'Use prime factorization method.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Science diagram: The Water Cycle', description: 'Draw evaporation, condensation, precipitation in color.', category: 'Assignment', priority: 'High', daysOffset: 3 },
        { title: 'Revise Social Studies: Physical features of India', description: 'Mountains, plains, desert, plateaus and coastlines.', category: 'Revision', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 1, topic: 'Factors, multiples, HCF & LCM', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 50, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'States of matter & molecular structure', dayOffset: 0, startH: 16, startM: 0, endH: 16, endM: 50, priority: 'High', completed: false },
        { subjectIndex: 0, topic: 'Subject-verb agreement & letter writing', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 45, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Class 4 Math Assessment 1', subjectIndex: 1, daysOffset: 8, description: 'HCF, LCM, fractions, perimeter, metric units.' },
        { name: 'Science Half-Yearly Exam', subjectIndex: 2, daysOffset: 16, description: 'Plant adaptations, digestion, states of matter, solar system.' }
      ],
      notes: [
        { title: 'HCF and LCM Quick Formula', subjectIndex: 1, content: 'Product of two numbers = HCF x LCM\nHCF is always <= smallest number.\nLCM is always >= largest number.', pinned: true }
      ]
    },

    'class-5': {
      id: 'class-5',
      name: 'Class 5',
      category: CATEGORIES.PRIMARY,
      categoryKey: 'primary',
      badge: 'Primary School',
      icon: 'book',
      description: 'Fractions/decimals, volume, human nervous system, world geography, history, and block AI logic.',
      dailyGoal: 120,
      focusDefault: 30,
      breakDefault: 5,
      subjects: [
        {
          name: 'English Language & Literature',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Active & Passive Voice Basics', 'Direct/Indirect Speech', 'Clauses & Complex Sentences', 'Formal Letter & Essay Writing', 'Prose, Drama & Classic Poetry']
        },
        {
          name: 'Mathematics',
          color: '#0ea5e9',
          icon: 'math',
          target: 85,
          chapters: ['Large Numbers & Roman Numerals', 'Operations on Fractions & Decimals', 'Percentages & Simple Interest Basics', 'Average & Unitary Method', 'Area, Perimeter & Volume', 'Geometry: Angles, Circles & Triangles', 'Data Handling & Bar Graphs']
        },
        {
          name: 'General Science',
          color: '#10b981',
          icon: 'atom',
          target: 80,
          chapters: ['Plant Reproduction & Seed Dispersal', 'Animal Habitats & Body Coverings', 'Skeletal & Nervous System', 'Food, Health, Hygiene & Deficiency Diseases', 'Simple Machines (Lever, Pulley, Inclined Plane)', 'Air, Atmosphere & Water Purification', 'Rocks, Minerals & Soil Conservation']
        },
        {
          name: 'Social Studies',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['Latitudes & Longitudes / Earth Grid', 'Continents & Oceans of the World', 'Democratic Republic of Congo & Greenland', 'The Freedom Struggle of India (1857-1947)', 'The United Nations (UN) & Global Peace', 'Governing Ourselves: Indian Constitution']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Sandhi, Samas Basics', 'Shabd Rachna & Muhavare', 'Nibandh Lekhan', 'Kavita & Gadya']
        },
        {
          name: 'Computer Science & AI',
          color: '#8b5cf6',
          icon: 'code',
          target: 85,
          chapters: ['Evolution & Generations of Computers', 'Advanced MS Word & Excel Formulas', 'Scratch 3.0: Variables & Sensing', 'Introduction to Artificial Intelligence & Robotics']
        }
      ],
      tasks: [
        { title: 'Calculate area and perimeter of complex shapes', description: 'Exercise 9.3 questions 1 to 8.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Science: Diagram of human eye and reflex arc', description: 'Label cornea, pupil, lens, retina, optic nerve.', category: 'Assignment', priority: 'High', daysOffset: 2 },
        { title: 'Write an essay on Freedom Struggle of India', description: 'Mention 1857 revolt, Gandhi ji, Dandi March, 1947.', category: 'Project', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 1, topic: 'Decimals, percentages & unitary method', dayOffset: 0, startH: 9, startM: 0, endH: 9, endM: 50, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Skeletal & nervous system anatomy', dayOffset: 0, startH: 16, startM: 0, endH: 16, endM: 50, priority: 'High', completed: false },
        { subjectIndex: 3, topic: 'Latitudes, longitudes & Indian freedom movement', dayOffset: 1, startH: 10, startM: 0, endH: 10, endM: 45, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Class 5 Math Term 1', subjectIndex: 1, daysOffset: 10, description: 'Fractions, decimals, unitary method, area & volume.' },
        { name: 'Science Half-Yearly', subjectIndex: 2, daysOffset: 18, description: 'Nervous system, simple machines, diseases & rocks.' }
      ],
      notes: [
        { title: 'Simple Machines Types', subjectIndex: 2, content: '1. Lever (Class 1, 2, 3)\n2. Pulley\n3. Wheel and Axle\n4. Inclined Plane\n5. Wedge\n6. Screw', pinned: true }
      ]
    },

    'class-6': {
      id: 'class-6',
      name: 'Class 6',
      category: CATEGORIES.MIDDLE,
      categoryKey: 'middle',
      badge: 'Middle School',
      icon: 'layers',
      description: 'Algebra, integers, physics/chemistry/biology separation, ancient civilizations, geography, and Python.',
      dailyGoal: 135,
      focusDefault: 30,
      breakDefault: 5,
      subjects: [
        {
          name: 'Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 85,
          chapters: ['Knowing Our Numbers & Large Numbers', 'Whole Numbers & Playing with Numbers', 'Basic Geometrical Ideas & Elementary Shapes', 'Integers (Addition & Subtraction)', 'Fractions & Decimals', 'Introduction to Algebra & Expressions', 'Ratio & Proportion', 'Perimeter, Area & Practical Geometry']
        },
        {
          name: 'Science (Physics / Chem / Bio)',
          color: '#0ea5e9',
          icon: 'atom',
          target: 80,
          chapters: ['Food: Components & Deficiency', 'Sorting Materials into Groups', 'Separation of Substances', 'Getting to Know Plants & Photosynthesis', 'Body Movements & Skeletal System', 'The Living Organisms & Habitats', 'Motion & Measurement of Distances', 'Light, Shadows & Reflections', 'Electricity & Circuits', 'Fun with Magnets']
        },
        {
          name: 'Social Science (Hist / Civ / Geo)',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['History: What, Where, How & When', 'From Hunting-Gathering to Growing Food', 'In the Earliest Cities (Indus Valley)', 'Ashoka, The Emperor Who Gave Up War', 'Geography: Earth in the Solar System', 'Globe: Latitudes, Longitudes & Motions of Earth', 'Major Domains & Landforms of Earth', 'Civics: Diversity, Government & Panchayati Raj']
        },
        {
          name: 'English Language & Literature',
          color: '#10b981',
          icon: 'book',
          target: 85,
          chapters: ['Sentence Structures & Clauses', 'Tenses, Modals & Voice', 'Vocabulary, Idioms & Phrasal Verbs', 'Notice Writing & Factual Description', 'Honeysuckle & A Pact with the Sun Prose']
        },
        {
          name: 'Second Language (Hindi/Sanskrit)',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Vasant Bhaag 1 Gadya & Padya', 'Bal Ramkatha', 'Vyakaran: Sandhi, Karak, Samas', 'Patra & Nibandh Lekhan']
        },
        {
          name: 'Computer Science & Python',
          color: '#8b5cf6',
          icon: 'code',
          target: 85,
          chapters: ['Computer Networks & Cloud Computing Basics', 'HTML5 Web Page Basics (Tags, Lists, Links)', 'Python Programming: Variables & Data Types', 'Python: Conditional Statements (if-else)']
        }
      ],
      tasks: [
        { title: 'Solve linear algebraic equations worksheet', description: 'Class 6 algebra chapter exercise 11.2.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Science experiment write-up: Light and shadows', description: 'Explain pinhole camera, opaque vs translucent objects.', category: 'Assignment', priority: 'High', daysOffset: 2 },
        { title: 'History revision: Indus Valley civilization', description: 'Town planning, Great Bath, drainage system, trade.', category: 'Revision', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Integers, negative numbers & algebra', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Electricity, circuits & conductors/insulators', dayOffset: 0, startH: 15, startM: 30, endH: 16, endM: 30, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Indus Valley architecture & early cities', dayOffset: 1, startH: 10, startM: 0, endH: 11, endM: 0, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Class 6 Math Mid-Term Exam', subjectIndex: 0, daysOffset: 7, description: 'Integers, algebra, ratio & proportion, geometry.' },
        { name: 'Science Term 1 Examination', subjectIndex: 1, daysOffset: 14, description: 'Electricity, components of food, motion, magnets.' }
      ],
      notes: [
        { title: 'Rules for Integer Arithmetic', subjectIndex: 0, content: '(+) x (+) = (+)\n(-) x (-) = (+)\n(+) x (-) = (-)\n(-) + (-) = Add and keep negative sign.', pinned: true }
      ]
    },

    'class-7': {
      id: 'class-7',
      name: 'Class 7',
      category: CATEGORIES.MIDDLE,
      categoryKey: 'middle',
      badge: 'Middle School',
      icon: 'layers',
      description: 'Rational numbers, linear equations, acids & bases, heat, medieval history, and web development.',
      dailyGoal: 135,
      focusDefault: 30,
      breakDefault: 5,
      subjects: [
        {
          name: 'Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 85,
          chapters: ['Integers & Fractions/Decimals Review', 'Data Handling: Mean, Median, Mode', 'Simple Linear Equations in One Variable', 'Lines, Angles & Triangle Properties', 'Congruence of Triangles & Comparing Quantities', 'Rational Numbers & Exponents', 'Perimeter, Area & Algebraic Expressions']
        },
        {
          name: 'Science',
          color: '#0ea5e9',
          icon: 'atom',
          target: 80,
          chapters: ['Nutrition in Plants (Autotrophic/Heterotrophic)', 'Nutrition in Animals & Human Digestion', 'Heat & Temperature Measurement', 'Acids, Bases & Salts / Indicators', 'Physical & Chemical Changes', 'Respiration in Organisms', 'Transportation in Animals & Plants', 'Reproduction in Plants', 'Motion & Time / Electric Current & Effects', 'Light: Spherical Mirrors & Lenses']
        },
        {
          name: 'Social Science',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['History: Delhi Sultans & Mughal Empire', 'Rulers and Buildings / Towns, Traders & Craftspersons', 'Devotional Paths to the Divine', 'Geography: Environment & Inside Our Earth', 'Our Changing Earth, Air & Water Systems', 'Human Environment & Tropical/Subtropical Life', 'Civics: Equality in Indian Democracy & State Govt', 'Role of Media, Advertising & Markets']
        },
        {
          name: 'English',
          color: '#10b981',
          icon: 'book',
          target: 85,
          chapters: ['Grammar: Conjunctions, Modals, Voice', 'Diary Entry & Informal/Formal Letters', 'Story Writing with Clues', 'Honeycomb & An Alien Hand Prose/Poetry']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Vasant Bhaag 2', 'Mahabharat Prasang', 'Vyakaran: Alankar, Samas, Muhavare', 'Lekhan Kaushal']
        },
        {
          name: 'Computer Applications & Web',
          color: '#8b5cf6',
          icon: 'code',
          target: 85,
          chapters: ['Number System (Binary, Decimal, Hex)', 'Advanced HTML5 & CSS Styling', 'Python: Lists, Tuples & For Loops', 'Cyber Safety, Ethics & Privacy']
        }
      ],
      tasks: [
        { title: 'Solve linear equations in one variable', description: 'Exercise 4.3 questions 1 to 12.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Science revision: Acids, Bases and Salts', description: 'Litmus test, neutralization reaction, pH indicators.', category: 'Revision', priority: 'High', daysOffset: 2 },
        { title: 'History essay: Mughal administration under Akbar', description: 'Mansabdari system, revenue policy, Din-i-Ilahi.', category: 'Project', priority: 'Medium', daysOffset: 5 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Linear equations & algebraic expressions', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Acids, bases, salts & neutralization', dayOffset: 0, startH: 16, startM: 0, endH: 17, endM: 0, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Class 7 Math Midterm', subjectIndex: 0, daysOffset: 8, description: 'Linear equations, triangle properties, rational numbers.' },
        { name: 'Science Half-Yearly', subjectIndex: 1, daysOffset: 15, description: 'Nutrition, heat, acids/bases, respiration, motion & time.' }
      ],
      notes: [
        { title: 'Neutralization Reaction', subjectIndex: 1, content: 'Acid + Base -> Salt + Water + Heat\nExample: HCl + NaOH -> NaCl + H2O', pinned: true }
      ]
    },

    'class-8': {
      id: 'class-8',
      name: 'Class 8',
      category: CATEGORIES.MIDDLE,
      categoryKey: 'middle',
      badge: 'Middle School',
      icon: 'layers',
      description: 'Square roots, linear equations, force, friction, cell structure, modern history, and Python algorithms.',
      dailyGoal: 150,
      focusDefault: 35,
      breakDefault: 5,
      subjects: [
        {
          name: 'Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 85,
          chapters: ['Rational Numbers & Properties', 'Linear Equations in One Variable', 'Understanding Quadrilaterals & Geometry', 'Data Handling & Probability', 'Squares, Square Roots, Cubes & Cube Roots', 'Comparing Quantities (CI, Profit/Loss, Discount)', 'Algebraic Expressions & Identities', 'Mensuration (Cylinder, Cone, Sphere Area & Vol)', 'Exponents, Direct/Inverse Proportions & Factorization']
        },
        {
          name: 'Science',
          color: '#0ea5e9',
          icon: 'atom',
          target: 80,
          chapters: ['Crop Production & Agricultural Practices', 'Microorganisms: Friend & Foe', 'Coal & Petroleum / Combustion & Flame', 'Conservation of Plants & Animals', 'Reproduction in Animals & Adolescence', 'Force and Pressure / Friction', 'Sound: Frequency, Amplitude & Pitch', 'Chemical Effects of Electric Current', 'Some Natural Phenomena (Lightning, Earthquakes)', 'Light: Reflection & Dispersion / Solar System']
        },
        {
          name: 'Social Science',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['History: How, When and Where / Trade to Territory', 'Ruling the Countryside / Tribals, Dikus & Golden Age', 'When People Rebel (1857 Revolt)', 'Civilising the "Native", Educating the Nation', 'Women, Caste and Reform', 'The Making of the National Movement (1870s-1947)', 'Geography: Resources, Land, Soil, Water, Minerals', 'Agriculture, Industries & Human Resources', 'Civics: The Indian Constitution, Secularism, Judiciary']
        },
        {
          name: 'English',
          color: '#10b981',
          icon: 'book',
          target: 85,
          chapters: ['Advanced Tenses & Subject-Verb Concord', 'Active/Passive & Direct/Indirect Speech', 'Analytical Paragraph Writing & Formal Letters', 'Honeydew & It So Happened Literature']
        },
        {
          name: 'Second Language',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Vasant Bhaag 3', 'Bharat Ki Khoj (Discovery of India)', 'Vyakaran: Sandhi, Upsarg, Pratyay, Samas', 'Patra & Samvad Lekhan']
        },
        {
          name: 'Computer Science & Python',
          color: '#8b5cf6',
          icon: 'code',
          target: 85,
          chapters: ['Computer Networks & Topologies', 'App Development & UI Prototyping', 'Python: Functions, Modules & String Methods', 'Relational Databases (SQL Basics)']
        }
      ],
      tasks: [
        { title: 'Solve quadratic factorization problems', description: 'Exercise 14.2 all identities problems.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Science lab note: Chemical effect of electric current', description: 'Electroplating process and copper sulphate experiment.', category: 'Assignment', priority: 'High', daysOffset: 3 },
        { title: 'Revise 1857 revolt causes and consequences', description: 'Political, economic, military and social factors.', category: 'Revision', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Factorization using algebraic identities', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 15, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Sound, frequency, pitch & force/pressure', dayOffset: 0, startH: 16, startM: 0, endH: 17, endM: 15, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Class 8 Mathematics Midterm', subjectIndex: 0, daysOffset: 10, description: 'Square roots, linear equations, mensuration, factorization.' },
        { name: 'Science Term 1 Exam', subjectIndex: 1, daysOffset: 16, description: 'Force, sound, chemical effects of current, reproduction, crop production.' }
      ],
      notes: [
        { title: 'Standard Algebraic Identities', subjectIndex: 0, content: '1. (a + b)² = a² + 2ab + b²\n2. (a - b)² = a² - 2ab + b²\n3. (a + b)(a - b) = a² - b²\n4. (x + a)(x + b) = x² + (a + b)x + ab', pinned: true }
      ]
    },

    'class-9': {
      id: 'class-9',
      name: 'Class 9',
      category: CATEGORIES.SECONDARY,
      categoryKey: 'secondary',
      badge: 'High School',
      icon: 'target',
      description: 'Polynomials, Euclidean geometry, laws of motion, atoms/molecules, cell biology, and AI/IT.',
      dailyGoal: 150,
      focusDefault: 40,
      breakDefault: 8,
      subjects: [
        {
          name: 'Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 85,
          chapters: ['Number Systems (Irrational Numbers & Real Lines)', 'Polynomials (Factor Theorem & Algebraic Identities)', 'Coordinate Geometry & Linear Equations in Two Variables', 'Introduction to Euclid Geometry, Lines & Angles', 'Triangles (Congruence Criteria SAS, ASA, SSS, RHS)', 'Quadrilaterals & Circles Theorems', 'Heron\'s Formula & Surface Areas/Volumes', 'Statistics (Histograms, Mean, Median, Mode)']
        },
        {
          name: 'Science (Physics, Chem, Bio)',
          color: '#0ea5e9',
          icon: 'atom',
          target: 80,
          chapters: ['Matter in Our Surroundings & Is Matter Around Us Pure', 'Atoms and Molecules / Structure of the Atom', 'The Fundamental Unit of Life (Cell & Organelles)', 'Tissues: Plant (Meristematic) & Animal (Epithelial, Muscular)', 'Motion: Velocity, Acceleration & Graphical Equations', 'Force and Laws of Motion (Newton 1st, 2nd, 3rd Law)', 'Gravitation & Floatation / Work and Energy', 'Sound: Reflection, Ultrasound & Human Ear', 'Improvement in Food Resources']
        },
        {
          name: 'Social Science',
          color: '#f59e0b',
          icon: 'compass',
          target: 80,
          chapters: ['History: The French Revolution', 'Socialism in Europe & The Russian Revolution', 'Nazism and the Rise of Hitler', 'Geography: India - Size & Location / Physical Features', 'Drainage, Climate, Natural Vegetation & Wildlife', 'Democracy: What & Why / Constitutional Design', 'Electoral Politics & Democratic Rights', 'Economics: The Story of Village Palampur', 'People as Resource / Poverty as a Challenge']
        },
        {
          name: 'English Language & Literature',
          color: '#10b981',
          icon: 'book',
          target: 85,
          chapters: ['Integrated Grammar (Gap filling, Editing, Omission)', 'Descriptive Paragraph & Diary Entry', 'Story Writing with Prompts', 'Beehive Prose & Poetry', 'Moments Supplementary Reader']
        },
        {
          name: 'Second Language / Hindi',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Sparsh / Kshitij Gadya & Padya', 'Sanchayan / Kritika', 'Vyakaran: Sandhi, Upsarg, Pratyay, Samas, Vakya', 'Anuched & Patra Lekhan']
        },
        {
          name: 'Information Technology / AI',
          color: '#8b5cf6',
          icon: 'code',
          target: 85,
          chapters: ['Digital Documentation (Advanced LibreOffice/Word)', 'Electronic Spreadsheet & Formula Modeling', 'Digital Presentation & Slide Masters', 'Cyber Ethics & Artificial Intelligence Project Cycle']
        }
      ],
      tasks: [
        { title: 'Derive 3 equations of motion graphically', description: 'v = u + at, s = ut + 1/2at², v² = u² + 2as with graph.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Math: Factor Theorem on cubic polynomials', description: 'Exercise 2.4 problems 1 to 5.', category: 'Practice', priority: 'High', daysOffset: 2 },
        { title: 'French Revolution timeline and key causes', description: 'Estates General, Bastille, Reign of Terror, Napoleon.', category: 'Revision', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Polynomials factor theorem & identities', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 15, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Newton laws of motion & momentum conservation', dayOffset: 0, startH: 16, startM: 0, endH: 17, endM: 15, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'French Revolution & Russian Revolution', dayOffset: 1, startH: 10, startM: 0, endH: 11, endM: 15, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Class 9 Math Term 1', subjectIndex: 0, daysOffset: 11, description: 'Number systems, polynomials, coordinate geometry, lines & angles.' },
        { name: 'Science Half-Yearly Exam', subjectIndex: 1, daysOffset: 17, description: 'Motion, laws of motion, gravitation, cell, atoms & molecules.' }
      ],
      notes: [
        { title: 'Equations of Motion', subjectIndex: 1, content: '1. v = u + at\n2. s = ut + ½ at²\n3. v² = u² + 2as\nWhere u=initial vel, v=final vel, a=acc, t=time, s=displacement.', pinned: true }
      ]
    },

    'class-10': {
      id: 'class-10',
      name: 'Class 10',
      category: CATEGORIES.SECONDARY,
      categoryKey: 'secondary',
      badge: 'Board Exam Track',
      icon: 'target',
      description: 'CBSE / ICSE Board curriculum: Quadratic equations, trigonometry, electricity, life processes, and modern world.',
      dailyGoal: 180,
      focusDefault: 45,
      breakDefault: 10,
      subjects: [
        {
          name: 'Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 90,
          chapters: ['Real Numbers & Fundamental Theorem of Arithmetic', 'Polynomials & Zeros Relationship', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations (Quadratic Formula & Nature of Roots)', 'Arithmetic Progressions (nth Term & Sum)', 'Triangles (Similarity Criteria & Basic Proportionality Theorem)', 'Coordinate Geometry (Distance & Section Formula)', 'Introduction to Trigonometry & Trigonometric Identities', 'Applications of Trigonometry (Heights & Distances)', 'Circles & Tangents Theorems', 'Surface Areas and Volumes', 'Statistics & Probability']
        },
        {
          name: 'Science (Physics, Chem, Bio)',
          color: '#0ea5e9',
          icon: 'atom',
          target: 90,
          chapters: ['Chemical Reactions & Balancing Equations', 'Acids, Bases and Salts / pH Scale & Salts', 'Metals and Non-metals / Metallurgy & Reactivity Series', 'Carbon and its Compounds / Covalent Bonding & Functional Groups', 'Life Processes (Nutrition, Respiration, Transportation, Excretion)', 'Control and Coordination (Nervous System & Hormones)', 'How do Organisms Reproduce? (Asexual & Sexual Reproduction)', 'Heredity and Evolution / Mendel\'s Experiments', 'Light: Reflection & Refraction / Mirror & Lens Formulas', 'The Human Eye and the Colourful World / Atmospheric Refraction', 'Electricity: Ohm\'s Law, Resistance, Series/Parallel Circuits', 'Magnetic Effects of Electric Current / Electromagnetic Induction', 'Our Environment & Ecosystem Food Webs']
        },
        {
          name: 'Social Science',
          color: '#f59e0b',
          icon: 'compass',
          target: 85,
          chapters: ['History: The Rise of Nationalism in Europe', 'Nationalism in India (Non-Cooperation & Civil Disobedience)', 'The Making of a Global World / The Age of Industrialisation', 'Print Culture and the Modern World', 'Geography: Resources and Development / Forest & Wildlife', 'Water Resources, Agriculture (Crops & Farming)', 'Minerals and Energy Resources / Manufacturing Industries', 'Democracy: Power Sharing & Federalism', 'Gender, Religion and Caste / Political Parties', 'Economics: Development Indicators', 'Sectors of the Indian Economy', 'Money and Credit / Globalization and Indian Economy']
        },
        {
          name: 'English Language & Literature',
          color: '#10b981',
          icon: 'book',
          target: 85,
          chapters: ['Reading Comprehension & Discursive Passages', 'Formal Letter (Editor/Complaint/Inquiry) & Analytical Paragraph', 'Integrated Grammar (Tenses, Modals, Subject-Verb Concord, Reported Speech)', 'First Flight (Prose & Poetry Masteries)', 'Footprints Without Feet Supplementary']
        },
        {
          name: 'Second Language / Hindi',
          color: '#ec4899',
          icon: 'feather',
          target: 85,
          chapters: ['Sparsh / Kshitij Gadya & Kavya', 'Sanchayan / Kritika', 'Vyakaran: Padbandh, Rachna ke aadhar par Vakya, Samas, Muhavare', 'Anuched Lekhan, Patra Lekhan, Vigyapan & Sandesh Lekhan']
        },
        {
          name: 'Information Technology (IT 402)',
          color: '#8b5cf6',
          icon: 'code',
          target: 90,
          chapters: ['Digital Documentation (Advanced Styles & Mail Merge)', 'Electronic Spreadsheet (Scenarios, Goal Seek, Macros)', 'Database Management System (RDBMS, SQL Queries)', 'Web Applications and Security (Networking & Cyber Safety)']
        }
      ],
      tasks: [
        { title: 'Solve 15 trigonometry identity proofs', description: 'Exercise 8.4 NCERT and previous year board questions.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Physics: Numerical problems on Ohm Law & Circuits', description: 'Equivalent resistance in series/parallel circuits.', category: 'Practice', priority: 'High', daysOffset: 2 },
        { title: 'Biology diagrams: Human Heart & Nephron structure', description: 'Draw and label flow of oxygenated vs deoxygenated blood.', category: 'Assignment', priority: 'High', daysOffset: 3 },
        { title: 'Nationalism in India timeline & map work', description: 'Locate Champaran, Kheda, Ahmedabad, Dandi, Chauri Chaura.', category: 'Revision', priority: 'Medium', daysOffset: 5 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Trigonometric identities & heights/distances', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 30, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Electric current, potential difference & Ohm\'s Law', dayOffset: 0, startH: 15, startM: 30, endH: 17, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Nationalism in India & Power Sharing', dayOffset: 1, startH: 10, startM: 0, endH: 11, endM: 30, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'Class 10 Pre-Board Mathematics', subjectIndex: 0, daysOffset: 12, description: 'Full syllabus: Trigonometry, quadratic equations, triangles, statistics.' },
        { name: 'Class 10 Pre-Board Science', subjectIndex: 1, daysOffset: 19, description: 'Physics circuits/optics, chemistry carbon/metals, biology life processes/heredity.' }
      ],
      notes: [
        { title: 'Key Trigonometric Identities', subjectIndex: 0, content: '1. sin²θ + cos²θ = 1\n2. 1 + tan²θ = sec²θ\n3. 1 + cot²θ = cosec²θ\n4. tanθ = sinθ/cosθ, cotθ = cosθ/sinθ', pinned: true },
        { title: 'Ohm\'s Law Formulae', subjectIndex: 1, content: 'V = I * R\nP = V * I = I²R = V²/R\nSeries: R_eq = R1 + R2 + R3\nParallel: 1/R_eq = 1/R1 + 1/R2 + 1/R3', pinned: true }
      ]
    },

    'class-11': {
      id: 'class-11',
      name: 'Class 11',
      category: CATEGORIES.SENIOR,
      categoryKey: 'senior',
      badge: 'Senior Secondary',
      icon: 'code',
      description: 'Kinematics, thermodynamics, chemical bonding, organic chemistry, calculus, and computer science.',
      dailyGoal: 180,
      focusDefault: 50,
      breakDefault: 10,
      subjects: [
        {
          name: 'Physics',
          color: '#0ea5e9',
          icon: 'atom',
          target: 85,
          chapters: ['Units, Dimensions & Error Analysis', 'Motion in a Straight Line & Vectors', 'Motion in a Plane (Projectiles & Circular)', 'Laws of Motion & Friction', 'Work, Energy and Power', 'System of Particles & Rotational Motion', 'Gravitation & Planetary Laws', 'Mechanical Properties of Solids & Fluids', 'Thermodynamics & Kinetic Theory of Gases', 'Oscillations (SHM) & Waves']
        },
        {
          name: 'Chemistry',
          color: '#6366f1',
          icon: 'layout',
          target: 85,
          chapters: ['Some Basic Concepts of Chemistry (Mole Concept)', 'Structure of Atom (Quantum Numbers, Orbitals)', 'Classification of Elements & Periodicity', 'Chemical Bonding & Molecular Structure (VSEPR, Hybridization)', 'Chemical Thermodynamics & Hess Law', 'Equilibrium (Chemical & Ionic)', 'Redox Reactions & Oxidation Numbers', 'Organic Chemistry: Basic Principles & Techniques (IUPAC, Isomerism, Mechanisms)', 'Hydrocarbons (Alkanes, Alkenes, Alkynes, Aromatic)']
        },
        {
          name: 'Mathematics',
          color: '#8b5cf6',
          icon: 'math',
          target: 85,
          chapters: ['Sets, Relations and Functions', 'Trigonometric Functions & General Formulas', 'Complex Numbers and Quadratic Equations', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series (AP, GP)', 'Straight Lines & Conic Sections (Parabola, Ellipse, Hyperbola)', 'Introduction to 3D Geometry', 'Limits and Derivatives (Calculus Foundations)', 'Statistics & Probability']
        },
        {
          name: 'Computer Science / Biology',
          color: '#10b981',
          icon: 'code',
          target: 85,
          chapters: ['Computer Systems Overview', 'Python Programming: Functions, Strings, Lists, Dictionaries', 'Python Modules & Data File Handling (Text/CSV)', 'Cyber Safety & Society, Law and Ethics', 'Cell Structure, Biomolecules & Cell Cycle (Bio)']
        },
        {
          name: 'English Core',
          color: '#f59e0b',
          icon: 'book',
          target: 80,
          chapters: ['Reading Comprehension & Note Making', 'Notice, Poster, Speech & Debate Writing', 'Hornbill Prose & Poetry', 'Snapshots Supplementary Reader']
        }
      ],
      tasks: [
        { title: 'Solve 10 projectile motion numericals', description: 'Calculate time of flight, maximum height, horizontal range.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Chemistry: Draw Lewis structures and hybridization', description: 'CH4, H2O, NH3, PCl5, SF6 geometry and bond angles.', category: 'Assignment', priority: 'High', daysOffset: 2 },
        { title: 'Derive derivative formulas using first principle', description: 'd/dx(sin x) = cos x, d/dx(x^n) = n*x^(n-1).', category: 'Practice', priority: 'High', daysOffset: 3 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Rotational dynamics & torque / angular momentum', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 30, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Thermodynamics enthalpy, entropy & Gibbs free energy', dayOffset: 0, startH: 15, startM: 30, endH: 17, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Limits, derivatives & continuity basics', dayOffset: 1, startH: 10, startM: 0, endH: 11, endM: 30, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Class 11 Physics Mid-Term', subjectIndex: 0, daysOffset: 10, description: 'Vectors, kinematics, laws of motion, work & rotational motion.' },
        { name: 'Chemistry Half-Yearly Exam', subjectIndex: 1, daysOffset: 18, description: 'Atomic structure, chemical bonding, thermodynamics, equilibrium.' }
      ],
      notes: [
        { title: 'Projectile Motion Key Equations', subjectIndex: 0, content: 'Time of flight: T = 2u*sinθ / g\nMax height: H = u²*sin²θ / (2g)\nRange: R = u²*sin(2θ) / g\nMax range occurs at θ = 45°', pinned: true }
      ]
    },

    'class-12': {
      id: 'class-12',
      name: 'Class 12',
      category: CATEGORIES.SENIOR,
      categoryKey: 'senior',
      badge: 'Senior Secondary / Boards',
      icon: 'code',
      description: 'Calculus, electrostatics, modern physics, organic reactions, entrance exam prep & boards.',
      dailyGoal: 210,
      focusDefault: 50,
      breakDefault: 10,
      subjects: [
        {
          name: 'Physics',
          color: '#0ea5e9',
          icon: 'atom',
          target: 90,
          chapters: ['Electrostatics: Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity & Kirchhoff\'s Laws', 'Moving Charges and Magnetism / Biot-Savart & Ampere', 'Magnetism and Matter', 'Electromagnetic Induction (Faraday & Lenz)', 'Alternating Current (LCR Circuits & Resonance)', 'Electromagnetic Waves', 'Ray Optics and Optical Instruments (Lenses & Prisms)', 'Wave Optics (Huygens, Interference & Diffraction)', 'Dual Nature of Radiation and Matter (Photoelectric Effect)', 'Atoms & Nuclei (Bohr Model & Radioactivity)', 'Semiconductor Electronics (Diodes, Rectifiers, Logic)']
        },
        {
          name: 'Chemistry',
          color: '#6366f1',
          icon: 'layout',
          target: 90,
          chapters: ['Solutions (Colligative Properties & Raoult\'s Law)', 'Electrochemistry (Nernst Equation & Kohlrausch Law)', 'Chemical Kinetics (Rate Laws & Arrhenius Equation)', 'd and f-Block Elements & Lanthanoid Contraction', 'Coordination Compounds (IUPAC, VBT & CFT)', 'Haloalkanes and Haloarenes (SN1 & SN2 Mechanisms)', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines (Diazonium Salts & Basicity)', 'Biomolecules (Carbohydrates, Proteins, Nucleic Acids)']
        },
        {
          name: 'Mathematics',
          color: '#8b5cf6',
          icon: 'math',
          target: 90,
          chapters: ['Relations and Functions (Types, Inverse)', 'Inverse Trigonometric Functions & Properties', 'Matrices and Determinants (Inverses & Cramer\'s)', 'Continuity and Differentiability', 'Applications of Derivatives (Maxima & Minima, Rate of Change)', 'Integrals (Indefinite & Definite)', 'Applications of the Integrals (Area Under Curves)', 'Differential Equations (Order, Degree & Solutions)', 'Vectors and Three Dimensional Geometry (Lines & Planes)', 'Linear Programming (Optimization)', 'Probability (Conditional, Bayes\' Theorem)']
        },
        {
          name: 'Computer Science / Biology',
          color: '#10b981',
          icon: 'code',
          target: 90,
          chapters: ['Python: OOP Classes, Inheritance, Exception Handling', 'Data Structures: Stacks and Queues', 'Computer Networks: Protocols, Architecture & Security', 'Database Management: SQL Joins, Aggregations & Python Connectivity', 'Genetics, Molecular Inheritance & Biotech (Bio Track)']
        },
        {
          name: 'English Core',
          color: '#f59e0b',
          icon: 'book',
          target: 85,
          chapters: ['Reading Passages (Discursive & Factual)', 'Formal Letters, Notices & Report Writing', 'Flamingo Prose & Poetry', 'Vistas Supplementary Reader']
        }
      ],
      tasks: [
        { title: 'Solve 20 definite integration problems', description: 'Use properties of definite integrals ∫ f(x)dx.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Physics: Ray optics derivations for lenses and prisms', description: 'Lens maker formula and prism minimum deviation formula.', category: 'Assignment', priority: 'High', daysOffset: 2 },
        { title: 'Chemistry name reactions flashcard review', description: 'Aldol condensation, Cannizzaro, Sandmeyer, Reimer-Tiemann.', category: 'Revision', priority: 'High', daysOffset: 3 },
        { title: 'Previous Year Board Question Paper solving', description: 'Complete 2025 Board Paper under timed conditions.', category: 'Practice', priority: 'High', daysOffset: 5 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Electromagnetic induction & AC LCR resonance', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 45, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Integration techniques & Area under curves', dayOffset: 0, startH: 15, startM: 30, endH: 17, endM: 15, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Aldehydes, Ketones & Carboxylic Acids mechanisms', dayOffset: 1, startH: 10, startM: 0, endH: 11, endM: 45, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Class 12 Pre-Board 1 - Physics', subjectIndex: 0, daysOffset: 9, description: 'Full board syllabus: Electrostatics, current, optics, modern physics.' },
        { name: 'Class 12 Pre-Board 1 - Mathematics', subjectIndex: 2, daysOffset: 14, description: 'Calculus, vectors & 3D geometry, matrices, probability.' },
        { name: 'Class 12 Pre-Board 1 - Chemistry', subjectIndex: 1, daysOffset: 20, description: 'Physical, inorganic coordination, and full organic chemistry.' }
      ],
      notes: [
        { title: 'Integration Shortcuts', subjectIndex: 2, content: '1. ∫ e^x [f(x) + f\'(x)] dx = e^x * f(x) + C\n2. King\'s Property: ∫[a,b] f(x) dx = ∫[a,b] f(a+b-x) dx\n3. Integration by parts: ∫ u*v dx = u∫v dx - ∫[u\' * ∫v dx] dx', pinned: true },
        { title: 'Nernst Equation', subjectIndex: 1, content: 'E_cell = E°_cell - (0.0591 / n) * log10(Q)\nAt 298 K under standard conditions.', pinned: true }
      ]
    },

    'diploma': {
      id: 'diploma',
      name: 'Diploma',
      category: CATEGORIES.HIGHER,
      categoryKey: 'higher',
      badge: 'Technical Diploma',
      icon: 'database',
      description: 'Applied sciences, technical drawing, CAD, circuit theory, and programming essentials.',
      dailyGoal: 150,
      focusDefault: 40,
      breakDefault: 10,
      subjects: [
        {
          name: 'Applied Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 85,
          chapters: ['Matrices, Determinants & System of Equations', 'Differential Calculus & Partial Derivatives', 'Integral Calculus & Engineering Applications', 'First Order Differential Equations', 'Statistics & Probability Distributions']
        },
        {
          name: 'Applied Physics & Chemistry',
          color: '#0ea5e9',
          icon: 'atom',
          target: 80,
          chapters: ['Elasticity, Viscosity & Fluid Mechanics', 'Thermodynamics & Heat Transfer', 'Optics, Acoustics & Ultrasonics', 'Electrochemistry, Corrosion & Battery Tech', 'Polymers, Lubricants & Industrial Chemistry']
        },
        {
          name: 'Engineering Graphics & CAD',
          color: '#f59e0b',
          icon: 'layout',
          target: 85,
          chapters: ['Engineering Curves (Conics, Cycloids)', 'Orthographic Projections (First & Third Angle)', 'Isometric Projections & Sectional Views', 'Computer Aided Drafting (AutoCAD 2D/3D Basics)', 'Dimensioning & Standard Fasteners']
        },
        {
          name: 'Electrical & Electronics Engineering',
          color: '#ec4899',
          icon: 'chart',
          target: 80,
          chapters: ['DC Circuit Theorems (Thevenin, Norton, Superposition)', 'AC Circuits & Power Factor', 'Transformers & Induction Motors Basics', 'Semiconductor Diodes, BJTs & Rectifiers', 'Sensors, Transducers & PLC Basics']
        },
        {
          name: 'Programming & Web Fundamentals',
          color: '#10b981',
          icon: 'code',
          target: 85,
          chapters: ['Algorithms & Flowcharts', 'C / C++ Programming Fundamentals', 'Pointers, Structures & File I/O', 'HTML, CSS & JavaScript Basics']
        },
        {
          name: 'Technical Communication',
          color: '#8b5cf6',
          icon: 'book',
          target: 80,
          chapters: ['Technical Report Writing & Memos', 'Presentation Skills & Group Discussions', 'Resume Writing & Interview Preparation']
        }
      ],
      tasks: [
        { title: 'AutoCAD isometric machine part drafting', description: 'Draw bracket and flange with full dimensions.', category: 'Assignment', priority: 'High', daysOffset: 2 },
        { title: 'Thevenin theorem numerical verification', description: 'Solve for load current in bridge circuit.', category: 'Homework', priority: 'High', daysOffset: 3 },
        { title: 'C programming pointer lab exercises', description: 'Implement dynamic memory allocation and string reversal.', category: 'Project', priority: 'Medium', daysOffset: 5 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Differential equations & matrix solutions', dayOffset: 0, startH: 9, startM: 30, endH: 11, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Orthographic and isometric projections', dayOffset: 0, startH: 15, startM: 0, endH: 16, endM: 30, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Diploma Applied Math Mid-Semester', subjectIndex: 0, daysOffset: 12, description: 'Matrices, differential calculus, first order ODEs.' },
        { name: 'Engineering Graphics Practical Exam', subjectIndex: 2, daysOffset: 18, description: 'CAD modeling, orthographic views, sectional projections.' }
      ],
      notes: [
        { title: 'Thevenin Theorem Steps', subjectIndex: 3, content: '1. Remove load resistance R_L\n2. Calculate open-circuit voltage V_th\n3. Deactivate all sources and find R_th\n4. I_L = V_th / (R_th + R_L)', pinned: true }
      ]
    },

    'engineering': {
      id: 'engineering',
      name: 'Engineering (B.Tech / B.E.)',
      category: CATEGORIES.HIGHER,
      categoryKey: 'higher',
      badge: 'Undergraduate Engineering',
      icon: 'code',
      description: 'Data structures, algorithms, OS, DBMS, computer networks, systems architecture & math.',
      dailyGoal: 180,
      focusDefault: 50,
      breakDefault: 10,
      subjects: [
        {
          name: 'Data Structures & Algorithms',
          color: '#10b981',
          icon: 'code',
          target: 90,
          chapters: ['Asymptotic Complexity & Big-O Notation', 'Arrays, Strings & Bit Manipulation', 'Linked Lists, Stacks & Queues', 'Trees, BST, AVL & Red-Black Trees', 'Heaps, Priority Queues & Disjoint Sets', 'Graphs (BFS, DFS, Dijkstra, Prim, Kruskal)', 'Dynamic Programming & Memoization', 'Greedy Algorithms, Divide & Conquer', 'Backtracking & Branch and Bound']
        },
        {
          name: 'Operating Systems',
          color: '#0ea5e9',
          icon: 'layout',
          target: 85,
          chapters: ['Processes, Threads & Concurrency', 'CPU Scheduling Algorithms', 'Process Synchronization (Semaphores, Mutex)', 'Deadlocks (Detection, Prevention, Banker\'s)', 'Memory Management & Virtual Memory (Paging)', 'Page Replacement (LRU, FIFO, Optimal)', 'File Systems & Storage / Linux Kernel Architecture']
        },
        {
          name: 'Database Management Systems',
          color: '#ec4899',
          icon: 'database',
          target: 85,
          chapters: ['ER Modeling & Relational Schema', 'Relational Algebra & Tuple Calculus', 'Advanced SQL (Joins, Subqueries, Windows, CTE)', 'Normalization (1NF, 2NF, 3NF, BCNF)', 'Indexing (B-Trees, B+ Trees, Hashing)', 'Transactions & ACID Properties', 'Concurrency Control (2PL, Timestamp, MVCC)', 'NoSQL Databases & Distributed Storage']
        },
        {
          name: 'Computer Networks',
          color: '#f59e0b',
          icon: 'chart',
          target: 80,
          chapters: ['OSI 7-Layer & TCP/IP Model', 'Data Link Layer (Framing, Flow & Error Control)', 'Network Layer (IP Addressing, Subnetting, CIDR)', 'Routing Protocols (OSPF, BGP, Distance Vector)', 'Transport Layer (TCP Handshake, Congestion Control, UDP)', 'Application Layer (DNS, HTTP/HTTPS, WebSockets)', 'Network Security & Cryptography (RSA, AES, TLS)']
        },
        {
          name: 'Engineering Mathematics',
          color: '#6366f1',
          icon: 'math',
          target: 80,
          chapters: ['Linear Algebra (Eigenvalues & Eigenvectors)', 'Multivariable Calculus & Vector Fields', 'Probability & Random Variables (Bayes, Gaussian)', 'Discrete Mathematics & Graph Theory', 'Fourier Series & Laplace Transforms']
        },
        {
          name: 'Software Engineering & System Design',
          color: '#8b5cf6',
          icon: 'atom',
          target: 85,
          chapters: ['Object Oriented Design & SOLID Principles', 'Design Patterns (Singleton, Factory, Observer)', 'Microservices Architecture & REST APIs', 'CI/CD Pipelines, Docker & Kubernetes', 'System Design (Load Balancing, Caching, Sharding)']
        }
      ],
      tasks: [
        { title: 'Implement Dijkstra shortest path algorithm', description: 'Write in C++/Python with adjacency list and min-heap.', category: 'Project', priority: 'High', daysOffset: 1 },
        { title: 'Solve 5 Dynamic Programming problems on LeetCode', description: '0/1 Knapsack, Longest Common Subsequence, Coin Change.', category: 'Practice', priority: 'High', daysOffset: 2 },
        { title: 'DBMS schema normalization practice', description: 'Convert e-commerce raw schema to 3NF and BCNF.', category: 'Homework', priority: 'High', daysOffset: 3 },
        { title: 'Socket programming TCP client-server chat', description: 'Implement multi-threaded client-server in Python/Java.', category: 'Assignment', priority: 'Medium', daysOffset: 5 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Graph traversals & Dynamic Programming', dayOffset: 0, startH: 9, startM: 0, endH: 10, endM: 45, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Deadlock avoidance & Banker algorithm', dayOffset: 0, startH: 15, startM: 30, endH: 17, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'SQL Query optimization & B+ Tree indexing', dayOffset: 1, startH: 10, startM: 0, endH: 11, endM: 30, priority: 'Medium', completed: false }
      ],
      exams: [
        { name: 'DSA Mid-Term Examination', subjectIndex: 0, daysOffset: 8, description: 'Trees, heaps, graph algorithms, dynamic programming.' },
        { name: 'Operating Systems & DBMS Finals', subjectIndex: 1, daysOffset: 17, description: 'Virtual memory, synchronization, normalization, transactions.' }
      ],
      notes: [
        { title: 'SOLID Design Principles Cheat Sheet', subjectIndex: 5, content: 'S - Single Responsibility Principle\nO - Open/Closed Principle\nL - Liskov Substitution Principle\nI - Interface Segregation Principle\nD - Dependency Inversion Principle', pinned: true },
        { title: 'ACID Properties in DBMS', subjectIndex: 2, content: 'A - Atomicity (All or nothing)\nC - Consistency (Valid state transitions)\nI - Isolation (Concurrent execution produces same result as serial)\nD - Durability (Committed changes survive crashes)', pinned: true }
      ]
    },

    'undergraduate': {
      id: 'undergraduate',
      name: 'Undergraduate (B.A. / B.Sc. / B.Com / B.B.A)',
      category: CATEGORIES.HIGHER,
      categoryKey: 'higher',
      badge: 'Bachelor Degree',
      icon: 'bookmark',
      description: 'Major core tracks, research methodology, quantitative reasoning, academic writing & electives.',
      dailyGoal: 150,
      focusDefault: 45,
      breakDefault: 10,
      subjects: [
        {
          name: 'Core Major Track I',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Fundamental Theories & Historical Paradigms', 'Critical Frameworks & Modern Debates', 'Core Methodologies & Field Applications', 'Case Studies & Empirical Analysis', 'Contemporary Perspectives & Trends']
        },
        {
          name: 'Core Major Track II',
          color: '#0ea5e9',
          icon: 'layout',
          target: 85,
          chapters: ['Domain Specialization Concepts', 'Advanced Models & Analytical Frameworks', 'Quantitative/Qualitative Investigation', 'Literature Synthesis & Critical Reviews']
        },
        {
          name: 'Research Methodology & Statistics',
          color: '#10b981',
          icon: 'chart',
          target: 80,
          chapters: ['Formulating Research Questions & Hypotheses', 'Quantitative & Qualitative Research Design', 'Data Collection (Surveys, Interviews, Sampling)', 'Statistical Inference, Regression & Hypothesis Testing', 'Ethics in Academic Research & Citations']
        },
        {
          name: 'Academic Writing & Communication',
          color: '#ec4899',
          icon: 'feather',
          target: 80,
          chapters: ['Literature Review Writing Techniques', 'Scholarly Essays & Annotated Bibliographies', 'APA / MLA / Chicago Citation Formatting', 'Conference Paper & Seminar Presentations']
        },
        {
          name: 'Interdisciplinary Elective',
          color: '#f59e0b',
          icon: 'compass',
          target: 75,
          chapters: ['Foundational Elective Concepts', 'Cross-Domain Applications', 'Project Milestone & Seminar Paper']
        }
      ],
      tasks: [
        { title: 'Draft literature review chapter (1500 words)', description: 'Synthesize 10 peer-reviewed journal papers in APA format.', category: 'Project', priority: 'High', daysOffset: 2 },
        { title: 'Perform hypothesis regression analysis in SPSS / R', description: 'Analyze dataset survey results and interpret p-values.', category: 'Assignment', priority: 'High', daysOffset: 3 },
        { title: 'Prepare slide deck for midterm seminar presentation', description: '10 slides on research methodology and preliminary findings.', category: 'Homework', priority: 'Medium', daysOffset: 5 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Theoretical frameworks & literature synthesis', dayOffset: 0, startH: 10, startM: 0, endH: 11, endM: 30, priority: 'High', completed: false },
        { subjectIndex: 2, topic: 'Hypothesis testing & regression modeling', dayOffset: 0, startH: 15, startM: 0, endH: 16, endM: 30, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Core Major Mid-Semester Exam', subjectIndex: 0, daysOffset: 12, description: 'Core theories, critical analysis, and comparative essays.' },
        { name: 'Research Methodology Assessment', subjectIndex: 2, daysOffset: 20, description: 'Research design, sampling techniques, regression interpretation.' }
      ],
      notes: [
        { title: 'Literature Review Structure', subjectIndex: 3, content: '1. Introduction: Scope and thesis statement\n2. Thematic Body: Group papers by themes, not authors\n3. Critical Synthesis: Compare methodologies & findings\n4. Research Gap: Identify what remains unanswered\n5. Conclusion', pinned: true }
      ]
    },

    'postgraduate': {
      id: 'postgraduate',
      name: 'Postgraduate (Master\'s / Ph.D. / M.Tech / M.B.A)',
      category: CATEGORIES.HIGHER,
      categoryKey: 'higher',
      badge: 'Master / Doctoral',
      icon: 'bookmark',
      description: 'Advanced domain specialization, thesis research, empirical modeling, seminar publication & defenses.',
      dailyGoal: 180,
      focusDefault: 55,
      breakDefault: 10,
      subjects: [
        {
          name: 'Advanced Domain Specialization',
          color: '#6366f1',
          icon: 'atom',
          target: 90,
          chapters: ['State-of-the-Art Theoretical Foundations', 'Cutting-Edge Literature & Paradigm Shifts', 'Advanced Mathematical / Conceptual Models', 'Empirical Case Studies & Industry Implementations', 'Future Research Horizons & Open Questions']
        },
        {
          name: 'Thesis & Dissertation Research',
          color: '#8b5cf6',
          icon: 'feather',
          target: 90,
          chapters: ['Research Problem Formulation & Novelty Claim', 'Comprehensive Systematic Literature Review', 'Methodological Rigor & Experimental Design', 'Data Acquisition, Processing & Benchmarking', 'Results Analysis, Discussion & Limitations', 'Thesis Drafting, Revision & Defense Preparation']
        },
        {
          name: 'Advanced Quantitative & Qualitative Methods',
          color: '#0ea5e9',
          icon: 'chart',
          target: 85,
          chapters: ['Multivariate Statistical Analysis & Econometrics', 'Machine Learning / High-Dimensional Data Modeling', 'Structural Equation Modeling (SEM)', 'Grounded Theory & Thematic Coding Analysis', 'Model Validation, Sensitivity & Reproducibility']
        },
        {
          name: 'Research Seminar & Peer-Review Publishing',
          color: '#10b981',
          icon: 'layout',
          target: 85,
          chapters: ['Writing for High-Impact Journals (IEEE, Elsevier, Springer)', 'Response to Reviewers & Peer-Review Etiquette', 'Conference Presentation & Academic Defense Slides', 'Grant Writing & Research Funding Proposals']
        }
      ],
      tasks: [
        { title: 'Complete thesis Chapter 3: Research Methodology', description: 'Detail experimental pipeline, mathematical formulations and dataset.', category: 'Project', priority: 'High', daysOffset: 2 },
        { title: 'Re-run benchmark model experiments with 5-fold cross-validation', description: 'Log accuracy, F1 score, MSE in research notebook.', category: 'Assignment', priority: 'High', daysOffset: 3 },
        { title: 'Draft rebuttal letter for journal paper revision', description: 'Point-by-point response to reviewer comments 1 to 8.', category: 'Homework', priority: 'High', daysOffset: 6 }
      ],
      sessions: [
        { subjectIndex: 1, topic: 'Thesis empirical analysis & results discussion', dayOffset: 0, startH: 9, startM: 0, endH: 11, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 0, topic: 'Advanced specialization paper readings', dayOffset: 0, startH: 15, startM: 0, endH: 16, endM: 45, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Comprehensive Doctoral / Master Examination', subjectIndex: 0, daysOffset: 14, description: 'Comprehensive coverage of core domain specialization.' },
        { name: 'Thesis Proposal / Progress Defense', subjectIndex: 1, daysOffset: 25, description: 'Oral committee presentation of research methodology and preliminary results.' }
      ],
      notes: [
        { title: 'Journal Paper Submission Checklist', subjectIndex: 3, content: '1. Clear novelty statement in abstract and introduction\n2. Robust baseline comparisons\n3. Statistical significance tests reported (p < 0.05)\n4. High-resolution vector diagrams\n5. Clean reproducible code and data links', pinned: true }
      ]
    },

    'other': {
      id: 'other',
      name: 'Other / Self-Directed Learner',
      category: CATEGORIES.HIGHER,
      categoryKey: 'higher',
      badge: 'Custom Curriculum',
      icon: 'sparkles',
      description: 'Flexible modular framework for competitive exams, professional certifications, or customized learning tracks.',
      dailyGoal: 120,
      focusDefault: 35,
      breakDefault: 5,
      subjects: [
        {
          name: 'Core Study Track',
          color: '#6366f1',
          icon: 'book',
          target: 85,
          chapters: ['Foundational Concepts & Principles', 'Intermediate Applications & Problem Solving', 'Advanced Topics & Case Studies', 'Comprehensive Revision & Test Series']
        },
        {
          name: 'Skill & Professional Development',
          color: '#0ea5e9',
          icon: 'code',
          target: 80,
          chapters: ['Technical / Domain Skills Workshop', 'Hands-on Projects & Portfolios', 'Industry Standards & Best Practices', 'Certifications Preparation']
        },
        {
          name: 'Aptitude, Logic & Problem Solving',
          color: '#10b981',
          icon: 'math',
          target: 80,
          chapters: ['Quantitative Reasoning & Mental Math', 'Logical Deduction & Analytical Reasoning', 'Data Interpretation & Graphs', 'Verbal Ability & Reading Comprehension']
        },
        {
          name: 'Project Work & Portfolio',
          color: '#f59e0b',
          icon: 'layout',
          target: 80,
          chapters: ['Project Ideation & Requirements', 'Implementation Milestones', 'Testing & Documentation', 'Final Showcase & Deployment']
        }
      ],
      tasks: [
        { title: 'Complete module 2 assignment', description: 'Review key chapter notes and answer practice exercises.', category: 'Homework', priority: 'High', daysOffset: 1 },
        { title: 'Solve 20 aptitude & logic practice questions', description: 'Timed practice for competitive problem solving.', category: 'Practice', priority: 'Medium', daysOffset: 2 },
        { title: 'Work on capstone project milestones', description: 'Build next core module and push code / notes.', category: 'Project', priority: 'Medium', daysOffset: 4 }
      ],
      sessions: [
        { subjectIndex: 0, topic: 'Core subject concept review and deep focus', dayOffset: 0, startH: 9, startM: 30, endH: 11, endM: 0, priority: 'High', completed: false },
        { subjectIndex: 1, topic: 'Skill development & project implementation', dayOffset: 0, startH: 16, startM: 0, endH: 17, endM: 15, priority: 'High', completed: false }
      ],
      exams: [
        { name: 'Milestone Assessment 1', subjectIndex: 0, daysOffset: 10, description: 'Evaluation of foundational modules and problem solving.' },
        { name: 'Certification Practice Mock', subjectIndex: 1, daysOffset: 21, description: 'Full-length timed practice test.' }
      ],
      notes: [
        { title: 'Personal Study Goals', subjectIndex: 0, content: 'Focus on consistency, active recall, and spaced repetition.\nTrack daily hours and complete 1 project milestone per week.', pinned: true }
      ]
    }
  };

  // Build ordered list for UI display
  const ORDERED_KEYS = [
    'nursery', 'lkg', 'ukg',
    'class-1', 'class-2', 'class-3', 'class-4', 'class-5',
    'class-6', 'class-7', 'class-8',
    'class-9', 'class-10',
    'class-11', 'class-12',
    'diploma', 'engineering', 'undergraduate', 'postgraduate', 'other'
  ];

  function getPreset(key) {
    if (!key) return PRESETS['class-10'];
    const norm = String(key).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (PRESETS[norm]) return PRESETS[norm];
    // fuzzy match
    const found = ORDERED_KEYS.find((k) => {
      const p = PRESETS[k];
      return p.id === norm || p.name.toLowerCase() === key.toLowerCase() || norm.includes(k) || k.includes(norm);
    });
    return found ? PRESETS[found] : PRESETS['class-10'];
  }

  function getAllPresets() {
    return ORDERED_KEYS.map((k) => PRESETS[k]);
  }

  function getPresetsByCategory() {
    const grouped = {};
    Object.values(CATEGORIES).forEach((cat) => { grouped[cat] = []; });
    ORDERED_KEYS.forEach((k) => {
      const p = PRESETS[k];
      if (grouped[p.category]) grouped[p.category].push(p);
    });
    return grouped;
  }

  StudyFlow.ClassPresets = {
    CATEGORIES,
    PRESETS,
    ORDERED_KEYS,
    getPreset,
    getAllPresets,
    getPresetsByCategory
  };
})();
