let pieChartInstance = null;

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
    const cardLinkEl = document.getElementById('card-link');

    if (settings.fieldHeader) {
        fieldHeaderEl.textContent = settings.fieldHeader;
    }

    if (settings.url) {
        cardLinkEl.href = settings.url;
    } else {
        cardLinkEl.removeAttribute('href'); 
    }

    if (settings.selectedWorksheet) {
        fetchDataAndRenderChart(settings.selectedWorksheet);
    }
}

function fetchDataAndRenderChart(worksheetName) {
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    const worksheet = dashboard.worksheets.find(w => w.name === worksheetName);
    
    if (!worksheet) {
        console.error("Worksheet not found:", worksheetName);
        return;
    }

    // Add event listener to re-render if data changes (filter changes, etc)
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, () => fetchDataAndRenderChart(worksheetName));
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, () => fetchDataAndRenderChart(worksheetName));

    worksheet.getSummaryDataAsync().then(function(dataTable) {
        // Assuming Column 1 is Category/Label, Column 2 is Value
        const labels = [];
        const dataValues = [];
        let totalCount = 0;

        dataTable.data.forEach(function(row) {
            // value is in row[0].value (Category) and row[1].value (Measure)
            if (row.length >= 2) {
                labels.push(row[0].formattedValue);
                const val = parseFloat(row[1].value) || 0;
                dataValues.push(val);
                totalCount += val;
            }
        });

        // Update Total Enrollments
        document.getElementById('total-count').textContent = totalCount.toLocaleString();

        // Render Chart
        renderChart(labels, dataValues);
    }).catch(function(error) {
        console.error("Error getting summary data:", error);
    });
}

function renderChart(labels, dataValues) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: [
                    '#1e52a8', // Spenders (dark blue)
                    '#4b8ce2', // Prospects (medium blue)
                    '#a4c9ef', // Prosp. spnd (light blue)
                    '#f0ad4e', // fallback colors...
                    '#d9534f',
                    '#5cb85c'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'Playfair Display', serif",
                            size: 11
                        },
                        color: '#4a5568',
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Function to handle the configuration popup
function configure() {
    const popupUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}config.html`;
    
    tableau.extensions.ui.displayDialogAsync(popupUrl, '0', { height: 450, width: 500 }).then((closePayload) => {
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
