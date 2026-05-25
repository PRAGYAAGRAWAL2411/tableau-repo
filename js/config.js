tableau.extensions.initializeDialogAsync().then(function (openPayload) {
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    const worksheetSelect = document.getElementById('worksheet');
    
    // Populate the dropdown with available worksheets
    worksheetSelect.innerHTML = '<option value="">-- Select a Worksheet --</option>';
    dashboard.worksheets.forEach(function (worksheet) {
        let option = document.createElement('option');
        option.value = worksheet.name;
        option.text = worksheet.name;
        worksheetSelect.appendChild(option);
    });

    // Populate form with existing settings
    const settings = tableau.extensions.settings.getAll();
    if (settings.fieldHeader) {
        document.getElementById('fieldHeader').value = settings.fieldHeader;
    }
    if (settings.url) {
        document.getElementById('url').value = settings.url;
    }
    if (settings.selectedWorksheet) {
        worksheetSelect.value = settings.selectedWorksheet;
    }
    
    // Handle form submission
    document.getElementById('configForm').addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const newHeader = document.getElementById('fieldHeader').value;
        const newUrl = document.getElementById('url').value;
        const newWorksheet = worksheetSelect.value;
        
        // Save settings to Tableau
        tableau.extensions.settings.set('fieldHeader', newHeader);
        tableau.extensions.settings.set('url', newUrl);
        tableau.extensions.settings.set('selectedWorksheet', newWorksheet);
        
        tableau.extensions.settings.saveAsync().then(function() {
            tableau.extensions.ui.closeDialog("Settings saved successfully.");
        }).catch(function(error) {
            console.error("Error saving settings.", error);
        });
    });
});
