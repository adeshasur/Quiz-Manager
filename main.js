const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    win.loadFile('index.html');

    win.once('ready-to-show', () => {
        win.show();
    });
}

// IPC Handlers for Database Operations

// 1. Team Registration & Persistent Bracket Generation
ipcMain.handle('register-teams', async (event, teams) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("DELETE FROM matches"); 
            db.run("DELETE FROM teams");
            db.run("UPDATE questions SET is_asked = 0");

            const teamStmt = db.prepare("INSERT INTO teams (team_name, member_1, member_2) VALUES (?, ?, ?)");
            teams.forEach(team => {
                teamStmt.run([team.teamName, team.member1, team.member2]);
            });
            
            teamStmt.finalize(() => {
                // Now fetch the newly inserted IDs to create matches
                db.all("SELECT id FROM teams", (err, rows) => {
                    if (err) reject(err);
                    
                    // Shuffle and pair
                    let ids = rows.map(r => r.id).sort(() => Math.random() - 0.5);
                    const matchStmt = db.prepare("INSERT INTO matches (team_1_id, team_2_id) VALUES (?, ?)");
                    for (let i = 0; i < ids.length; i += 2) {
                        if (ids[i+1]) {
                            matchStmt.run([ids[i], ids[i+1]]);
                        }
                    }
                    matchStmt.finalize(() => {
                        resolve({ success: true });
                    });
                });
            });
        });
    });
});

// 2. Fetch Persistent Matchups
ipcMain.handle('get-matchups', async () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                m.id as match_id,
                t1.team_name as t1_name, t1.id as t1_id,
                t2.team_name as t2_name, t2.id as t2_id,
                m.team_1_score, m.team_2_score
            FROM matches m
            JOIN teams t1 ON m.team_1_id = t1.id
            JOIN teams t2 ON m.team_2_id = t2.id
        `;
        db.all(query, (err, rows) => {
            if (err) reject(err);
            
            // Format for frontend
            const formatted = rows.map(r => ({
                id: r.match_id,
                team1: { id: r.t1_id, team_name: r.t1_name, score: r.team_1_score },
                team2: { id: r.t2_id, team_name: r.t2_name, score: r.team_2_score }
            }));
            resolve(formatted);
        });
    });
});

// 3. Get Unasked Question
ipcMain.handle('get-random-question', async () => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM questions WHERE is_asked = 0 ORDER BY RANDOM() LIMIT 1", (err, row) => {
            if (err) reject(err);
            if (!row) {
                resolve(null);
            } else {
                // Mark as asked
                db.run("UPDATE questions SET is_asked = 1 WHERE id = ?", row.id, (err) => {
                    if (err) reject(err);
                    resolve(row);
                });
            }
        });
    });
});

// 4. Update Score
ipcMain.handle('update-score', async (event, { matchId, t1Score, t2Score }) => {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE matches SET team_1_score = ?, team_2_score = ? WHERE id = ?",
            [t1Score, t2Score, matchId],
            (err) => {
                if (err) reject(err);
                resolve({ success: true });
            }
        );
    });
});

// App Lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});