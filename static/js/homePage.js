// Scroll to check or report section
function scrollToCheck() {
  document.getElementById("check").scrollIntoView({ behavior: 'smooth' });
}

function scrollToReport() {
  alert("Report form will be available in next version.");
}

// Check number simulation
function checkNumber() {
  const numberInput = document.getElementById("numberInput").value;
  const resultElement = document.getElementById("result");

  if (!numberInput.trim()) {
    resultElement.textContent = "Please enter a number to check.";
    resultElement.style.color = "red";
    return;
  }

  fetch(`/api/check_number?phone=${encodeURIComponent(numberInput)}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === "reported") {
        resultElement.innerHTML = `<strong>${data.message}</strong><br>
          📞 Number: ${numberInput}<br>
          🚨 Scam Type: ${data.report.scam_type}<br>
          📍 Location: ${data.report.location}<br>
          📝 Description: ${data.report.description}<br>
          📅 Date: ${data.report.date}`;
        resultElement.style.color = "red";
      } else {
        resultElement.textContent = data.message;
        resultElement.style.color = "green";
      }
    })
    .catch(error => {
      console.error("Error:", error);
      resultElement.textContent = "Something went wrong. Please try again.";
      resultElement.style.color = "orange";
    });
}

// Load latest scam reports into the table
document.addEventListener('DOMContentLoaded', function () {
  fetch('/api/latest_reports')
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('scamTable');
      tableBody.innerHTML = ''; // Clear any existing rows

      data.forEach(report => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${report.phone}</td>
          <td>${report.scam_type}</td>
          <td>${report.date}</td>
          <td>${report.report_count}</td>
          <td>${report.risk}</td>
        `;

        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error fetching scam reports:', error);
    });
    

  // Chart.js for Scam Statistics (Pie Chart)
  const ctx = document.getElementById('scamChart');
  if (ctx) {
    fetch('/api/scam_statistics')
      .then(response => response.json())
      .then(data => {
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.labels,
            datasets: [{
              data: data.counts,
              backgroundColor: [
                '#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0',
                '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#795548'
              ]
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
      })
      .catch(error => {
        console.error('Error loading scam statistics:', error);
      });
  }

  // Contact form submission
  document.querySelector('.contact-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;

    const response = await fetch('http://localhost:5000/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message })
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
        this.reset();
    }
  });
});