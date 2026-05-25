// Initialize the Tableau Extension
tableau.extensions.initializeAsync({'configure': configure}).then(function() {
    console.log("Tableau Extension initialized");
    
    // Once initialized, get settings and update UI
    const settings = tableau.extensions.settings.getAll();
    updateUI(settings);

    // Listen for settings change events
    tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
        updateUI(settingsEvent.newSettings);
    });
}).catch(function(error) {
    console.error("Error initializing Tableau extension:", error);
});

// Update the DOM based on saved settings
function updateUI(settings) {
    const fieldHeaderEl = document.getElementById('field-header');
    const chartImgEl = document.getElementById('chart-img');
    const cardLinkEl = document.getElementById('card-link');
    const legendEl = document.getElementById('legend');

    if (settings.fieldHeader) {
        fieldHeaderEl.textContent = settings.fieldHeader;
    }

    if (settings.imgUrl) {
        chartImgEl.src = settings.imgUrl;
        // Optionally hide the dummy legend if they provided their own image, 
        // assuming the provided image might contain the legend, but based on the prompt 
        // we'll keep it visible or hide it based on preference. Let's keep it visible for now.
    }

    if (settings.url) {
        cardLinkEl.href = settings.url;
    } else {
        cardLinkEl.removeAttribute('href'); // disable link if no URL
    }
}

// Function to handle the configuration popup
function configure() {
    // Determine the path to the config dialog
    const popupUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}config.html`;
    
    tableau.extensions.ui.displayDialogAsync(popupUrl, '0', { height: 400, width: 500 }).then((closePayload) => {
        // The dialog was closed
        console.log("Configuration dialog closed.", closePayload);
    }).catch((error) => {
        switch(error.errorCode) {
            case tableau.ErrorCodes.DialogClosedByUser:
                console.log("Dialog closed by user");
                break;
            default:
                console.error("Error opening dialog", error);
        }
    });
}
