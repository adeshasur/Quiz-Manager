const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    registerTeams: (teams) => ipcRenderer.invoke('register-teams', teams),
    getMatchups: () => ipcRenderer.invoke('get-matchups'),
    getRandomQuestion: () => ipcRenderer.invoke('get-random-question'),
    updateScore: (matchId, t1Score, t2Score) => ipcRenderer.invoke('update-score', { matchId, t1Score, t2Score }),
});
