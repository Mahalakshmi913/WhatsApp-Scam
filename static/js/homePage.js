// Scroll to check or report section
function scrollToCheck() {
  document.getElementById("check").scrollIntoView({ behavior: 'smooth' });
}

function scrollToReport() {
  alert("Report form will be available in next version.");
}

// Check number simulation
function checkNumber() {
  const number = document.getElementById("numberInput").value.trim();
  const result = document.getElementById("result");
  if (number === "") {
    result.textContent = "Please enter a WhatsApp number.";
    result.style.color = "red";
  } else if (number.includes("98765")) {
    result.textContent = "⚠️ This number has been reported 3 times. Risk: High";
    result.style.color = "#cc0000";
  } else {
    result.textContent = "✅ No scam reports found for this number.";
    result.style.color = "green";
  }
}

// Chart.js for Scam Statistics
window.onload = function() {
  const ctx = document.getElementById('scamChart');
  if (ctx) {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Job Scam', 'Loan Scam', 'Phishing', 'Fraud Call', 'Fake Offer'],
        datasets: [{
          data: [40, 25, 15, 10, 10],
          backgroundColor: ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
};
