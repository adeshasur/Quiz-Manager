const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(process.cwd(), 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database connected!');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Teams Table
        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            member_1 TEXT,
            member_2 TEXT
        )`);

        // Questions Table
        db.run(`CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_text TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            is_asked INTEGER DEFAULT 0
        )`);

        // Matches Table
        db.run(`CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_1_id INTEGER,
            team_2_id INTEGER,
            team_1_score INTEGER DEFAULT 0,
            team_2_score INTEGER DEFAULT 0,
            FOREIGN KEY(team_1_id) REFERENCES teams(id),
            FOREIGN KEY(team_2_id) REFERENCES teams(id)
        )`);

        // Seed some sample questions if the table is empty
        db.get("SELECT COUNT(*) as count FROM questions", (err, row) => {
            if (row.count === 0) {
                const stmt = db.prepare("INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?)");
                const sampleQuestions = [
                    ["What does CPU stand for?", "Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Control Personal Unit", "A"],
                    ["Which language is primarily used for Android apps?", "Java", "Swift", "C#", "Python", "A"],
                    ["What is the first programmer's name?", "Ada Lovelace", "Alan Turing", "Grace Hopper", "Katherine Johnson", "A"],
                    ["Which protocol is used for web browsing?", "HTTP", "FTP", "SMTP", "SSH", "A"],
                    ["Which year was the first iPhone released?", "2007", "2005", "2008", "2010", "A"],
                    ["Who co-founded Microsoft?", "Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Jeff Bezos", "A"],
                    ["What is the main component of a computer that performs calculations?", "CPU", "RAM", "GPU", "Motherboard", "A"],
                    ["What does HTML stand for?", "Hypertext Markup Language", "High-level Text Markup Language", "Hyperlink Text Management Logic", "Home Tool Markup Language", "A"],
                    ["Which company developed the Java programming language?", "Sun Microsystems", "Microsoft", "IBM", "Apple", "A"],
                    ["What is the binary representation of decimal 5?", "101", "111", "011", "110", "A"],
                    ["What is the most popular open-source operating system kernel?", "Linux", "Windows", "macOS", "Unix", "A"],
                    ["Who is known as the father of the World Wide Web?", "Tim Berners-Lee", "Vint Cerf", "Marc Andreessen", "Robert Cailliau", "A"],
                    ["Which data structure follows the Last-In-First-Out (LIFO) principle?", "Stack", "Queue", "Linked List", "Tree", "A"],
                    ["What does 'URL' stand for?", "Uniform Resource Locator", "Universal Reference Logo", "Unified Resource Link", "User Record List", "A"],
                    ["In networking, what does 'IP' stand for?", "Internet Protocol", "Internal Process", "Intelligent Program", "Interconnect Path", "A"],
                    ["Which CSS property is used to change the background color?", "background-color", "color", "bgcolor", "fill", "A"],
                    ["What is the primary function of a Router?", "Connecting networks", "Storing data", "Processing graphics", "Charging devices", "A"],
                    ["Which company created the React.js library?", "Facebook", "Google", "Amazon", "Microsoft", "A"],
                    ["What does SQL stand for?", "Structured Query Language", "Standard Quota Logic", "Simple Query List", "Sequential Queue Language", "A"],
                    ["Which programming language is known as the 'mother of all languages'?", "C", "Python", "Java", "Assembly", "A"],
                    ["How many bits make up a standard Byte?", "8", "4", "16", "32", "A"],
                    ["What is the default port for HTTPS?", "443", "80", "21", "22", "A"],
                    ["Which technology is used to create cryptocurrencies?", "Blockchain", "Cloud Computing", "AI", "Internet of Things", "A"],
                    ["What does RAM stand for?", "Random Access Memory", "Read-only Memory", "Rapid Action Module", "Real-time Access Media", "A"],
                    ["What is the extension of a Python file?", ".py", ".html", ".js", ".css", "A"]
                ];
                
                sampleQuestions.forEach(q => stmt.run(q));
                stmt.finalize();
                console.log("Sample questions seeded!");
            }
        });

        // Seed some sample teams if the table is empty
        db.get("SELECT COUNT(*) as count FROM teams", (err, row) => {
            if (row.count === 0) {
                const stmt = db.prepare("INSERT INTO teams (team_name, member_1, member_2) VALUES (?, ?, ?)");
                const sampleTeams = [
                    ["ANANDA COLLEGE", "Amal Perera", "Kamal Silva"],
                    ["ROYAL COLLEGE", "Sahan Gunawardena", "Nimal Karunadhara"],
                    ["NALANDA COLLEGE", "Dilshan Perera", "Amila Bandara"],
                    ["VISAKHA VIDYALAYA", "Nuwanthi Silva", "Kasuni Mendis"],
                    ["DHARMARAJA COLLEGE", "Pasindu Jayasinghe", "Shehan Kumara"],
                    ["ST. THOMAS' COLLEGE", "Malith Fernando", "Ishara Peiris"],
                    ["RICHMOND COLLEGE", "Kavindu Rathnayake", "Ashan Wickramasinghe"],
                    ["MAHINDA COLLEGE", "Dhanushka Gamage", "Gayashan Abeyratne"],
                    ["TRINITY COLLEGE", "Sunimal Herath", "Prabath Jayasuriya"],
                    ["ST. PETER'S COLLEGE", "Gihan de Silva", "Heshan Wijeratne"]
                ];
                
                sampleTeams.forEach(t => stmt.run(t));
                stmt.finalize();
                console.log("Sample teams seeded!");
            }
        });
    });
}

module.exports = db;
