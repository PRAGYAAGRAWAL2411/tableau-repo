tableau.extensions.initializeDialogAsync().then(function (openPayload) {
    // Populate form with existing settings
    const settings = tableau.extensions.settings.getAll();
    if (settings.fieldHeader) {
        document.getElementById('fieldHeader').value = settings.fieldHeader;
    }
    if (settings.url) {
        document.getElementById('url').value = settings.url;
    }
    if (settings.imgUrl) {
        document.getElementById('imgUrl').value = settings.imgUrl;
    }
    
    // Handle form submission
    document.getElementById('configForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent standard form submission
        
        const newHeader = document.getElementById('fieldHeader').value;
        const newUrl = document.getElementById('url').value;
        const newImgUrl = document.getElementById('imgUrl').value;
        
        // Save settings to Tableau
        tableau.extensions.settings.set('fieldHeader', newHeader);
        tableau.extensions.settings.set('url', newUrl);
        tableau.extensions.settings.set('imgUrl', newImgUrl);
        
        tableau.extensions.settings.saveAsync().then(function() {
            // Close dialog when done
            tableau.extensions.ui.closeDialog("Settings saved successfully.");
        }).catch(function(error) {
            console.error("Error saving settings.", error);
        });
    });
});
