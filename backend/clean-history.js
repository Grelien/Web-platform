const fs = require('fs');
const path = require('path');

// Path to irrigation history file
const historyFile = path.join(__dirname, 'data', 'irrigation-history.json');

try {
    // Read the current history
    const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    
    console.log(`Original history entries: ${historyData.length}`);
    
    // Filter out schedule_auto events - we only want one entry per scheduled irrigation
    const cleanedHistory = historyData.filter(event => {
        // Keep all non-schedule_auto events
        if (event.source !== 'schedule_auto') {
            return true;
        }
        
        // Remove schedule_auto events
        console.log(`Removing schedule_auto event: ${event.id} at ${event.timestamp}`);
        return false;
    });
    
    console.log(`Cleaned history entries: ${cleanedHistory.length}`);
    console.log(`Removed ${historyData.length - cleanedHistory.length} schedule_auto events`);
    
    // Save the cleaned history
    fs.writeFileSync(historyFile, JSON.stringify(cleanedHistory, null, 2));
    
    console.log('✅ Successfully cleaned irrigation history!');
    console.log('Now only one entry per scheduled irrigation will be logged when the session completes.');
    
} catch (error) {
    console.error('Error cleaning irrigation history:', error);
}
