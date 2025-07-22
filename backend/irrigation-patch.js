// Patch for preventing schedule_auto events
// This ensures only one history entry per scheduled irrigation

// Simple function to replace the corrupted one
function handleIrrigationStateChange(isOn) {
    if (isOn) {
        // Motor turned ON - start tracking session only if no active session
        if (!systemState.activeIrrigationSession && !sessionManager.activeSession) {
            systemState.activeIrrigationSession = {
                startTime: new Date().toISOString(),
                source: 'manual',
                scheduleId: null,
                scheduleDetails: null
            };
            console.log(`🚀 Started irrigation session:`, systemState.activeIrrigationSession);
        }
    } else {
        // Motor turned OFF - complete session
        // Only use session manager to avoid duplicate events
        if (sessionManager.activeSession) {
            sessionManager.end();
        }
    }
}

module.exports = { handleIrrigationStateChange };
