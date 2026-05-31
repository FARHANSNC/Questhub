const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User.model');
const Subject = require('../models/Subject.model');
const Question = require('../models/Question.model');
const Quiz = require('../models/Quiz.model');

const connectDB = require('../config/db');

// Safe user create - skips if already exists
const createUserSafe = async (data) => {
    try {
        return await User.create(data);
    } catch (e) {
        console.log(`User ${data.email} already exists, skipping...`);
        return await User.findOne({ email: data.email });
    }
};

const seedDatabase = async () => {
    try {
        await connectDB();

        // Create admin user
        const admin = await createUserSafe({
            username: 'admin',
            email: 'admin@questhub.com',
            password: 'Admin@123',
            fullName: 'Admin User',
            role: 'admin'
        });

        // Create regular user 1
        const teacher = await createUserSafe({
            username: 'user_john',
            email: 'john@questhub.com',
            password: 'User@123',
            fullName: 'John User',
            role: 'user'
        });

        // Create regular user 2
        await createUserSafe({
            username: 'farhan_ahmad',
            email: 'farhan@questhub.com',
            password: 'User@123',
            fullName: 'Farhan Ahmad',
            role: 'user'
        });

        console.log('Users done!');

        // Skip subjects/questions/quizzes if already seeded
        const existingSubjects = await Subject.countDocuments();
        if (existingSubjects > 0) {
            console.log('Subjects already seeded, skipping questions and quizzes...');
            console.log('\n✅ Seeding complete!');
            console.log('\n📋 Login Credentials:');
            console.log('   Admin:   admin@questhub.com / Admin@123');
            console.log('   User 1:  john@questhub.com / User@123');
            console.log('   User 2:  farhan@questhub.com / User@123');
            process.exit(0);
        }

        // Create subjects
        const subjects = await Subject.create([
            { name: 'Mathematics', code: 'MATH101', description: 'Basic to advanced mathematics', icon: '🔢', color: '#3498db', createdBy: admin._id },
            { name: 'Science', code: 'SCI101', description: 'General science and physics', icon: '🔬', color: '#2ecc71', createdBy: admin._id },
            { name: 'History', code: 'HIS101', description: 'World and Indian history', icon: '📜', color: '#e67e22', createdBy: admin._id },
            { name: 'Geography', code: 'GEO101', description: 'Physical and political geography', icon: '🌍', color: '#1abc9c', createdBy: admin._id },
            { name: 'General Knowledge', code: 'GK101', description: 'Current affairs and general awareness', icon: '💡', color: '#9b59b6', createdBy: admin._id },
            { name: 'Computer Science', code: 'CS101', description: 'Programming and computer basics', icon: '💻', color: '#e74c3c', createdBy: admin._id }
        ]);
        console.log('Subjects created!');

        const allQuestions = [];

        // Mathematics Questions
        const mathQuestions = [
            { questionText: 'What is 15 × 12?', options: [{ text: '170', isCorrect: false }, { text: '180', isCorrect: true }, { text: '190', isCorrect: false }, { text: '200', isCorrect: false }], difficulty: 'easy', explanation: '15 × 12 = 180' },
            { questionText: 'What is the square root of 144?', options: [{ text: '10', isCorrect: false }, { text: '11', isCorrect: false }, { text: '12', isCorrect: true }, { text: '13', isCorrect: false }], difficulty: 'easy', explanation: '√144 = 12' },
            { questionText: 'What is the value of π (pi) approximately?', options: [{ text: '3.14', isCorrect: true }, { text: '2.14', isCorrect: false }, { text: '4.14', isCorrect: false }, { text: '3.41', isCorrect: false }], difficulty: 'easy', explanation: 'π ≈ 3.14159' },
            { questionText: 'Solve: 2x + 6 = 16. Find x.', options: [{ text: '3', isCorrect: false }, { text: '4', isCorrect: false }, { text: '5', isCorrect: true }, { text: '6', isCorrect: false }], difficulty: 'medium', explanation: '2x = 16-6 = 10, so x = 5' },
            { questionText: 'What is the area of a circle with radius 7 cm?', options: [{ text: '154 cm²', isCorrect: true }, { text: '144 cm²', isCorrect: false }, { text: '164 cm²', isCorrect: false }, { text: '174 cm²', isCorrect: false }], difficulty: 'medium', explanation: 'Area = πr² = 22/7 × 49 = 154 cm²' },
            { questionText: 'What is 25% of 400?', options: [{ text: '100', isCorrect: true }, { text: '75', isCorrect: false }, { text: '125', isCorrect: false }, { text: '150', isCorrect: false }], difficulty: 'easy', explanation: '25/100 × 400 = 100' },
            { questionText: 'If a triangle has angles 60°, 70°, what is the third angle?', options: [{ text: '40°', isCorrect: false }, { text: '50°', isCorrect: true }, { text: '60°', isCorrect: false }, { text: '70°', isCorrect: false }], difficulty: 'easy', explanation: '180° - 60° - 70° = 50°' },
            { questionText: 'What is the derivative of x²?', options: [{ text: 'x', isCorrect: false }, { text: '2x', isCorrect: true }, { text: 'x²', isCorrect: false }, { text: '2', isCorrect: false }], difficulty: 'hard', explanation: 'd/dx(x²) = 2x by power rule' },
            { questionText: 'What is the LCM of 12 and 18?', options: [{ text: '24', isCorrect: false }, { text: '36', isCorrect: true }, { text: '48', isCorrect: false }, { text: '54', isCorrect: false }], difficulty: 'medium', explanation: 'LCM(12,18) = 36' },
            { questionText: 'How many degrees are in a straight angle?', options: [{ text: '90°', isCorrect: false }, { text: '180°', isCorrect: true }, { text: '270°', isCorrect: false }, { text: '360°', isCorrect: false }], difficulty: 'easy', explanation: 'A straight angle is exactly 180°' }
        ];
        for (const q of mathQuestions) {
            allQuestions.push({ ...q, subject: subjects[0]._id, createdBy: teacher._id, questionType: 'multiple-choice', points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1 });
        }

        // Science Questions
        const scienceQuestions = [
            { questionText: 'What is the chemical symbol for water?', options: [{ text: 'O2', isCorrect: false }, { text: 'H2O', isCorrect: true }, { text: 'CO2', isCorrect: false }, { text: 'NaCl', isCorrect: false }], difficulty: 'easy', explanation: 'Water = H2O (2 Hydrogen + 1 Oxygen)' },
            { questionText: 'What planet is known as the Red Planet?', options: [{ text: 'Venus', isCorrect: false }, { text: 'Jupiter', isCorrect: false }, { text: 'Mars', isCorrect: true }, { text: 'Saturn', isCorrect: false }], difficulty: 'easy', explanation: 'Mars appears red due to iron oxide on its surface' },
            { questionText: 'What is the speed of light in vacuum?', options: [{ text: '3 × 10⁶ m/s', isCorrect: false }, { text: '3 × 10⁸ m/s', isCorrect: true }, { text: '3 × 10⁴ m/s', isCorrect: false }, { text: '3 × 10¹⁰ m/s', isCorrect: false }], difficulty: 'medium', explanation: 'Speed of light ≈ 3 × 10⁸ m/s' },
            { questionText: 'What gas do plants absorb during photosynthesis?', options: [{ text: 'Oxygen', isCorrect: false }, { text: 'Nitrogen', isCorrect: false }, { text: 'Carbon Dioxide', isCorrect: true }, { text: 'Hydrogen', isCorrect: false }], difficulty: 'easy', explanation: 'Plants use CO2 + H2O + sunlight → glucose + O2' },
            { questionText: 'What is the SI unit of force?', options: [{ text: 'Pascal', isCorrect: false }, { text: 'Newton', isCorrect: true }, { text: 'Joule', isCorrect: false }, { text: 'Watt', isCorrect: false }], difficulty: 'easy', explanation: 'Force is measured in Newtons (N)' },
            { questionText: 'Which organelle is the powerhouse of the cell?', options: [{ text: 'Nucleus', isCorrect: false }, { text: 'Ribosome', isCorrect: false }, { text: 'Mitochondria', isCorrect: true }, { text: 'Golgi Body', isCorrect: false }], difficulty: 'easy', explanation: 'Mitochondria generate ATP (energy currency)' },
            { questionText: "What is Newton's Third Law?", options: [{ text: 'F = ma', isCorrect: false }, { text: 'Every action has equal and opposite reaction', isCorrect: true }, { text: 'Inertia law', isCorrect: false }, { text: 'Gravity law', isCorrect: false }], difficulty: 'medium', explanation: "Newton's 3rd law: For every action, there is an equal and opposite reaction" },
            { questionText: 'What is the atomic number of Carbon?', options: [{ text: '4', isCorrect: false }, { text: '6', isCorrect: true }, { text: '8', isCorrect: false }, { text: '12', isCorrect: false }], difficulty: 'medium', explanation: 'Carbon has 6 protons, atomic number = 6' },
            { questionText: 'Which vitamin is produced when skin is exposed to sunlight?', options: [{ text: 'Vitamin A', isCorrect: false }, { text: 'Vitamin B', isCorrect: false }, { text: 'Vitamin C', isCorrect: false }, { text: 'Vitamin D', isCorrect: true }], difficulty: 'easy', explanation: 'UV radiation triggers Vitamin D synthesis in skin' },
            { questionText: 'What is the hardest natural substance?', options: [{ text: 'Gold', isCorrect: false }, { text: 'Iron', isCorrect: false }, { text: 'Diamond', isCorrect: true }, { text: 'Platinum', isCorrect: false }], difficulty: 'easy', explanation: 'Diamond (10 on Mohs hardness scale)' }
        ];
        for (const q of scienceQuestions) {
            allQuestions.push({ ...q, subject: subjects[1]._id, createdBy: teacher._id, questionType: 'multiple-choice', points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1 });
        }

        // History Questions
        const historyQuestions = [
            { questionText: 'Who was the first President of India?', options: [{ text: 'Mahatma Gandhi', isCorrect: false }, { text: 'Dr. Rajendra Prasad', isCorrect: true }, { text: 'Jawaharlal Nehru', isCorrect: false }, { text: 'Sardar Patel', isCorrect: false }], difficulty: 'easy', explanation: 'Dr. Rajendra Prasad served from 1950-1962' },
            { questionText: 'In which year did India gain independence?', options: [{ text: '1945', isCorrect: false }, { text: '1946', isCorrect: false }, { text: '1947', isCorrect: true }, { text: '1948', isCorrect: false }], difficulty: 'easy', explanation: 'India became independent on August 15, 1947' },
            { questionText: 'Who built the Taj Mahal?', options: [{ text: 'Akbar', isCorrect: false }, { text: 'Shah Jahan', isCorrect: true }, { text: 'Jahangir', isCorrect: false }, { text: 'Aurangzeb', isCorrect: false }], difficulty: 'easy', explanation: 'Shah Jahan built it in memory of his wife Mumtaz Mahal' },
            { questionText: 'Which battle established British supremacy in India?', options: [{ text: 'Battle of Plassey', isCorrect: true }, { text: 'Battle of Panipat', isCorrect: false }, { text: 'Battle of Buxar', isCorrect: false }, { text: 'Battle of Haldighati', isCorrect: false }], difficulty: 'medium', explanation: 'Battle of Plassey (1757) was a decisive victory for the British East India Company' },
            { questionText: 'Who is known as the Father of the Nation in India?', options: [{ text: 'Jawaharlal Nehru', isCorrect: false }, { text: 'Subhas Chandra Bose', isCorrect: false }, { text: 'Mahatma Gandhi', isCorrect: true }, { text: 'Bhagat Singh', isCorrect: false }], difficulty: 'easy', explanation: 'Mahatma Gandhi is called the Father of the Nation' },
            { questionText: 'When did World War II end?', options: [{ text: '1943', isCorrect: false }, { text: '1944', isCorrect: false }, { text: '1945', isCorrect: true }, { text: '1946', isCorrect: false }], difficulty: 'easy', explanation: 'WWII ended in September 1945' },
            { questionText: 'Who was the first Emperor of the Mughal Empire?', options: [{ text: 'Akbar', isCorrect: false }, { text: 'Humayun', isCorrect: false }, { text: 'Babur', isCorrect: true }, { text: 'Shah Jahan', isCorrect: false }], difficulty: 'medium', explanation: 'Babur founded the Mughal Empire in 1526' },
            { questionText: 'The French Revolution began in which year?', options: [{ text: '1776', isCorrect: false }, { text: '1789', isCorrect: true }, { text: '1799', isCorrect: false }, { text: '1804', isCorrect: false }], difficulty: 'medium', explanation: 'The French Revolution began on July 14, 1789' },
            { questionText: 'Who discovered America?', options: [{ text: 'Vasco da Gama', isCorrect: false }, { text: 'Christopher Columbus', isCorrect: true }, { text: 'Marco Polo', isCorrect: false }, { text: 'Ferdinand Magellan', isCorrect: false }], difficulty: 'easy', explanation: 'Columbus reached the Americas in 1492' },
            { questionText: 'The Quit India Movement was launched in which year?', options: [{ text: '1940', isCorrect: false }, { text: '1941', isCorrect: false }, { text: '1942', isCorrect: true }, { text: '1943', isCorrect: false }], difficulty: 'medium', explanation: 'Quit India Movement was launched on August 8, 1942' }
        ];
        for (const q of historyQuestions) {
            allQuestions.push({ ...q, subject: subjects[2]._id, createdBy: teacher._id, questionType: 'multiple-choice', points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1 });
        }

        // Geography Questions
        const geoQuestions = [
            { questionText: 'What is the largest continent?', options: [{ text: 'Africa', isCorrect: false }, { text: 'Asia', isCorrect: true }, { text: 'Europe', isCorrect: false }, { text: 'North America', isCorrect: false }], difficulty: 'easy', explanation: 'Asia is the largest continent by area and population' },
            { questionText: 'Which is the longest river in the world?', options: [{ text: 'Amazon', isCorrect: false }, { text: 'Nile', isCorrect: true }, { text: 'Yangtze', isCorrect: false }, { text: 'Mississippi', isCorrect: false }], difficulty: 'easy', explanation: 'The Nile River is approximately 6,650 km long' },
            { questionText: 'What is the capital of Australia?', options: [{ text: 'Sydney', isCorrect: false }, { text: 'Melbourne', isCorrect: false }, { text: 'Canberra', isCorrect: true }, { text: 'Brisbane', isCorrect: false }], difficulty: 'medium', explanation: 'Canberra is the capital, not Sydney' },
            { questionText: 'Which is the smallest country in the world?', options: [{ text: 'Monaco', isCorrect: false }, { text: 'Vatican City', isCorrect: true }, { text: 'San Marino', isCorrect: false }, { text: 'Liechtenstein', isCorrect: false }], difficulty: 'easy', explanation: 'Vatican City is the smallest country (0.44 km²)' },
            { questionText: 'Mount Everest is located in which mountain range?', options: [{ text: 'Andes', isCorrect: false }, { text: 'Alps', isCorrect: false }, { text: 'Himalayas', isCorrect: true }, { text: 'Rocky Mountains', isCorrect: false }], difficulty: 'easy', explanation: 'Mount Everest (8,848m) is in the Himalayas' },
            { questionText: 'Which ocean is the largest?', options: [{ text: 'Atlantic', isCorrect: false }, { text: 'Indian', isCorrect: false }, { text: 'Pacific', isCorrect: true }, { text: 'Arctic', isCorrect: false }], difficulty: 'easy', explanation: 'Pacific Ocean covers about 63.8 million sq miles' },
            { questionText: 'What is the capital of Japan?', options: [{ text: 'Osaka', isCorrect: false }, { text: 'Tokyo', isCorrect: true }, { text: 'Kyoto', isCorrect: false }, { text: 'Yokohama', isCorrect: false }], difficulty: 'easy', explanation: 'Tokyo is the capital of Japan' },
            { questionText: 'Which desert is the largest hot desert?', options: [{ text: 'Gobi', isCorrect: false }, { text: 'Kalahari', isCorrect: false }, { text: 'Sahara', isCorrect: true }, { text: 'Arabian', isCorrect: false }], difficulty: 'easy', explanation: 'Sahara Desert is the largest hot desert (9.2 million km²)' },
            { questionText: 'Which country has the most population?', options: [{ text: 'USA', isCorrect: false }, { text: 'India', isCorrect: true }, { text: 'China', isCorrect: false }, { text: 'Indonesia', isCorrect: false }], difficulty: 'easy', explanation: 'India surpassed China as the most populous country' },
            { questionText: 'The Amazon Rainforest is primarily in which country?', options: [{ text: 'Peru', isCorrect: false }, { text: 'Colombia', isCorrect: false }, { text: 'Brazil', isCorrect: true }, { text: 'Venezuela', isCorrect: false }], difficulty: 'easy', explanation: 'About 60% of the Amazon is in Brazil' }
        ];
        for (const q of geoQuestions) {
            allQuestions.push({ ...q, subject: subjects[3]._id, createdBy: teacher._id, questionType: 'multiple-choice', points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1 });
        }

        // GK Questions
        const gkQuestions = [
            { questionText: 'Who wrote the national anthem of India?', options: [{ text: 'Bankim Chandra', isCorrect: false }, { text: 'Rabindranath Tagore', isCorrect: true }, { text: 'Sarojini Naidu', isCorrect: false }, { text: 'Muhammad Iqbal', isCorrect: false }], difficulty: 'easy', explanation: 'Jana Gana Mana was written by Rabindranath Tagore' },
            { questionText: 'What is the currency of Japan?', options: [{ text: 'Yuan', isCorrect: false }, { text: 'Won', isCorrect: false }, { text: 'Yen', isCorrect: true }, { text: 'Ringgit', isCorrect: false }], difficulty: 'easy', explanation: 'Japanese Yen (¥) is the currency of Japan' },
            { questionText: 'Which planet is the largest in our solar system?', options: [{ text: 'Saturn', isCorrect: false }, { text: 'Jupiter', isCorrect: true }, { text: 'Neptune', isCorrect: false }, { text: 'Uranus', isCorrect: false }], difficulty: 'easy', explanation: 'Jupiter is the largest planet in our solar system' },
            { questionText: 'Who invented the telephone?', options: [{ text: 'Thomas Edison', isCorrect: false }, { text: 'Alexander Graham Bell', isCorrect: true }, { text: 'Nikola Tesla', isCorrect: false }, { text: 'Guglielmo Marconi', isCorrect: false }], difficulty: 'easy', explanation: 'Alexander Graham Bell patented the telephone in 1876' },
            { questionText: 'How many bones are in the adult human body?', options: [{ text: '186', isCorrect: false }, { text: '196', isCorrect: false }, { text: '206', isCorrect: true }, { text: '216', isCorrect: false }], difficulty: 'medium', explanation: 'An adult human body has 206 bones' },
            { questionText: "Which gas is most abundant in Earth's atmosphere?", options: [{ text: 'Oxygen', isCorrect: false }, { text: 'Carbon Dioxide', isCorrect: false }, { text: 'Nitrogen', isCorrect: true }, { text: 'Argon', isCorrect: false }], difficulty: 'easy', explanation: "Nitrogen makes up about 78% of Earth's atmosphere" },
            { questionText: 'In which sport is the Davis Cup awarded?', options: [{ text: 'Cricket', isCorrect: false }, { text: 'Football', isCorrect: false }, { text: 'Tennis', isCorrect: true }, { text: 'Badminton', isCorrect: false }], difficulty: 'easy', explanation: "Davis Cup is the premier international team event in men's tennis" },
            { questionText: 'What does HTML stand for?', options: [{ text: 'Hyper Text Markup Language', isCorrect: true }, { text: 'High Tech Multi Language', isCorrect: false }, { text: 'Hyper Transfer Mark Language', isCorrect: false }, { text: 'Home Tool Markup Language', isCorrect: false }], difficulty: 'easy', explanation: 'HTML = HyperText Markup Language' },
            { questionText: 'Which blood type is known as the universal donor?', options: [{ text: 'A+', isCorrect: false }, { text: 'B+', isCorrect: false }, { text: 'AB+', isCorrect: false }, { text: 'O-', isCorrect: true }], difficulty: 'medium', explanation: 'O- can be given to patients of any blood type' },
            { questionText: 'Who painted the Mona Lisa?', options: [{ text: 'Michelangelo', isCorrect: false }, { text: 'Leonardo da Vinci', isCorrect: true }, { text: 'Raphael', isCorrect: false }, { text: 'Donatello', isCorrect: false }], difficulty: 'easy', explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 1500s' }
        ];
        for (const q of gkQuestions) {
            allQuestions.push({ ...q, subject: subjects[4]._id, createdBy: teacher._id, questionType: 'multiple-choice', points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1 });
        }

        // CS Questions
        const csQuestions = [
            { questionText: 'What does CPU stand for?', options: [{ text: 'Central Process Unit', isCorrect: false }, { text: 'Central Processing Unit', isCorrect: true }, { text: 'Computer Personal Unit', isCorrect: false }, { text: 'Central Processor Utility', isCorrect: false }], difficulty: 'easy', explanation: 'CPU = Central Processing Unit' },
            { questionText: 'Which language is used for web styling?', options: [{ text: 'HTML', isCorrect: false }, { text: 'JavaScript', isCorrect: false }, { text: 'CSS', isCorrect: true }, { text: 'Python', isCorrect: false }], difficulty: 'easy', explanation: 'CSS (Cascading Style Sheets) is used for styling web pages' },
            { questionText: 'What is the time complexity of binary search?', options: [{ text: 'O(n)', isCorrect: false }, { text: 'O(log n)', isCorrect: true }, { text: 'O(n²)', isCorrect: false }, { text: 'O(1)', isCorrect: false }], difficulty: 'hard', explanation: 'Binary search halves the search space each step → O(log n)' },
            { questionText: 'Which data structure uses FIFO?', options: [{ text: 'Stack', isCorrect: false }, { text: 'Queue', isCorrect: true }, { text: 'Array', isCorrect: false }, { text: 'Tree', isCorrect: false }], difficulty: 'medium', explanation: 'Queue follows FIFO (First In First Out)' },
            { questionText: 'What does SQL stand for?', options: [{ text: 'Structured Question Language', isCorrect: false }, { text: 'Structured Query Language', isCorrect: true }, { text: 'Simple Query Language', isCorrect: false }, { text: 'Standard Query Logic', isCorrect: false }], difficulty: 'easy', explanation: 'SQL = Structured Query Language' },
            { questionText: 'Which protocol is used for secure web browsing?', options: [{ text: 'HTTP', isCorrect: false }, { text: 'FTP', isCorrect: false }, { text: 'HTTPS', isCorrect: true }, { text: 'SMTP', isCorrect: false }], difficulty: 'easy', explanation: 'HTTPS adds SSL/TLS encryption to HTTP' },
            { questionText: 'What is Git used for?', options: [{ text: 'Web browsing', isCorrect: false }, { text: 'Version control', isCorrect: true }, { text: 'Database management', isCorrect: false }, { text: 'Compiling code', isCorrect: false }], difficulty: 'easy', explanation: 'Git is a distributed version control system' },
            { questionText: 'Which of these is NOT a JavaScript framework?', options: [{ text: 'React', isCorrect: false }, { text: 'Angular', isCorrect: false }, { text: 'Django', isCorrect: true }, { text: 'Vue', isCorrect: false }], difficulty: 'medium', explanation: 'Django is a Python web framework, not JavaScript' },
            { questionText: 'What is the full form of API?', options: [{ text: 'Application Programming Interface', isCorrect: true }, { text: 'Advanced Program Integration', isCorrect: false }, { text: 'Application Process Integration', isCorrect: false }, { text: 'Advanced Programming Interface', isCorrect: false }], difficulty: 'easy', explanation: 'API = Application Programming Interface' },
            { questionText: 'Which sorting algorithm has the best average-case time complexity?', options: [{ text: 'Bubble Sort', isCorrect: false }, { text: 'Selection Sort', isCorrect: false }, { text: 'Quick Sort', isCorrect: true }, { text: 'Insertion Sort', isCorrect: false }], difficulty: 'hard', explanation: 'Quick Sort has average O(n log n) time complexity' }
        ];
        for (const q of csQuestions) {
            allQuestions.push({ ...q, subject: subjects[5]._id, createdBy: teacher._id, questionType: 'multiple-choice', points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1 });
        }

        const createdQuestions = await Question.insertMany(allQuestions);
        console.log(`${createdQuestions.length} questions created!`);

        // Update subject question counts
        for (const subject of subjects) {
            const count = createdQuestions.filter(q => q.subject.toString() === subject._id.toString()).length;
            await Subject.findByIdAndUpdate(subject._id, { totalQuestions: count });
        }

        // Create quizzes
        for (const subject of subjects) {
            const subjectQuestions = createdQuestions.filter(q => q.subject.toString() === subject._id.toString());
            await Quiz.create({
                title: `${subject.name} Quiz - Level 1`,
                description: `Test your ${subject.name} knowledge with this beginner quiz`,
                quizType: 'subject-based',
                subject: subject._id,
                questions: subjectQuestions.map(q => q._id),
                totalQuestions: subjectQuestions.length,
                duration: 10,
                passingScore: 40,
                difficulty: 'mixed',
                isPublic: true,
                allowGuests: true,
                createdBy: teacher._id
            });
            await Subject.findByIdAndUpdate(subject._id, { $inc: { totalQuizzes: 1 } });
        }
        console.log('Quizzes created!');

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Admin:   admin@questhub.com / Admin@123');
        console.log('   User 1:  john@questhub.com / User@123');
        console.log('   User 2:  farhan@questhub.com / User@123');

        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedDatabase();