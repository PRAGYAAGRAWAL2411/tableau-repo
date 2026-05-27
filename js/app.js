let pieChartInstance = null;

// Initialize the Tableau Viz Extension
tableau.extensions.initializeAsync({'configure': configure}).then(function() {
    console.log("Tableau Viz Extension initialized");
    
    // Once initialized, get settings and update UI
    const settings = tableau.extensions.settings.getAll();
    updateUI(settings);

    // Listen for settings change events
    tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
        updateUI(settingsEvent.newSettings);
    });

    // Fetch initial data
    fetchDataAndRenderChart();
    
    // Re-fetch when the Marks card or filters change
    const worksheet = tableau.extensions.worksheetContent.worksheet;
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, fetchDataAndRenderChart);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, fetchDataAndRenderChart);

    // Workaround for Tableau Viz Extensions not having access to Parameter events:
    // We will poll the data every 2 seconds to see if it changed behind the scenes.
    let lastDataHash = "";
    setInterval(function() {
        const ws = tableau.extensions.worksheetContent.worksheet;
        ws.getSummaryDataAsync().then(function(dataTable) {
            // Create a simple string version of the data to see if it changed
            const currentDataHash = dataTable.data.map(row => row.map(cell => cell.value).join("|")).join("~");
            
            if (lastDataHash !== "" && currentDataHash !== lastDataHash) {
                // Data has changed (likely due to a parameter)! Update the chart.
                fetchDataAndRenderChart();
            }
            lastDataHash = currentDataHash;
        }).catch(function(e) {
            console.error("Polling error:", e);
        });
    }, 2000);

}).catch(function(error) {
    console.error("Error initializing Tableau extension:", error);
});

// Update the DOM based on saved settings
function updateUI(settings) {
    const fieldHeaderEl = document.getElementById('field-header');
    const cardLinkEl = document.getElementById('card-link');
    const subtitleEl = document.getElementById('subtitle-text');

    if (settings.fieldHeader) {
        fieldHeaderEl.textContent = settings.fieldHeader;
    } else {
        // Fallback to worksheet name if not configured
        if (tableau.extensions.worksheetContent && tableau.extensions.worksheetContent.worksheet) {
            fieldHeaderEl.textContent = tableau.extensions.worksheetContent.worksheet.name;
        }
    }

    if (settings.subtitleText) {
        subtitleEl.textContent = settings.subtitleText;
    } else {
        subtitleEl.textContent = "Total enrollments"; // Default fallback
    }

    if (settings.url) {
        cardLinkEl.href = settings.url;
    } else {
        cardLinkEl.removeAttribute('href'); 
    }
}

function fetchDataAndRenderChart() {
    // Viz extensions live on a specific worksheet
    const worksheet = tableau.extensions.worksheetContent.worksheet;
    
    // We use getSummaryDataAsync, assuming Tableau provides the marks data
    worksheet.getSummaryDataAsync().then(function(dataTable) {
        const labels = [];
        const dataValues = [];
        let totalCount = 0;

        dataTable.data.forEach(function(row) {
            // By default, assume Column 1 is Category and Column 2 is Value
            // Even if encodings aren't explicitly mapped in the JS, the Marks card drives the columns
            if (row.length >= 2) {
                labels.push(row[0].formattedValue);
                const val = parseFloat(row[1].value) || 0;
                dataValues.push(val);
                totalCount += val;
            } else if (row.length === 1) {
                // Fallback if only one column is dragged in
                labels.push(row[0].formattedValue);
                dataValues.push(1);
                totalCount += 1;
            }
        });

        // Append percentages to the labels so the legend matches the image
        if (totalCount > 0) {
            for (let i = 0; i < labels.length; i++) {
                const percentage = Math.round((dataValues[i] / totalCount) * 100);
                labels[i] = `${labels[i]} ${percentage}%`;
            }
        }

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
                    '#f0ad4e', 
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
                            family: "'Tableau Book', 'Open Sans', Arial, sans-serif",
                            size: 11
                        },
                        color: '#4a5568',
                        usePointStyle: false, // Use standard squares instead of circles
                        boxWidth: 10,
                        boxHeight: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function() {
                            return null; // Explicitly return null to completely remove the title element
                        },
                        label: function(context) {
                            let label = context.label || '';
                            
                            // More aggressive removal of the percentage (handles unexpected spaces)
                            label = label.replace(/\s*\d+%\s*$/, '');
                            
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
    
    tableau.extensions.ui.displayDialogAsync(popupUrl, '0', { height: 350, width: 450 }).then((closePayload) => {
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
