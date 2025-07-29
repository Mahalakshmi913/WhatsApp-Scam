// Sidebar navigation & section toggling
const menuItems = document.querySelectorAll('.sidebar-menu li');
const sections = document.querySelectorAll('.content-section');
const sectionTitle = document.getElementById('section-title');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    if (item.dataset.section === 'logout') {
      if (confirm('Are you sure you want to logout?')) {
        // TODO: add logout logic here
        alert('Logged out!');
      }
      return;
    }
    
    // Remove active class from all menu items and sections
    menuItems.forEach(i => i.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active-section'));
    
    // Activate clicked menu item and corresponding section
    item.classList.add('active');
    const activeSection = document.getElementById(item.dataset.section);
    if (activeSection) {
      activeSection.classList.add('active-section');
      sectionTitle.textContent = item.textContent;
    }
  });
});

// Table filter function
function filterTable(tableId, searchTerm) {
  const input = searchTerm.toLowerCase();
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName('tbody')[0].rows;

  for (let row of rows) {
    let textContent = row.textContent.toLowerCase();
    row.style.display = textContent.includes(input) ? '' : 'none';
  }
}

// Charts initialization using Chart.js
const reportsTrendCtx = document.getElementById('reportsTrendChart').getContext('2d');
const scamTypeCtx = document.getElementById('scamTypeChart').getContext('2d');

const reportsTrendChart = new Chart(reportsTrendCtx, {
  type: 'line',
  data: {
    labels: ['July 15', 'July 16', 'July 17', 'July 18', 'July 19', 'July 20', 'July 21'],
    datasets: [{
      label: 'Reports',
      data: [150, 200, 180, 220, 210, 190, 200],
      backgroundColor: 'rgba(230, 126, 34, 0.2)',
      borderColor: 'rgba(230, 126, 34, 1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

const scamTypeChart = new Chart(scamTypeCtx, {
  type: 'doughnut',
  data: {
    labels: ['Loan Scam', 'OTP Fraud', 'Fake Offers', 'Others'],
    datasets: [{
      label: 'Scam Types',
      data: [45, 25, 20, 10],
      backgroundColor: [
        '#e67e22',
        '#3498db',
        '#9b59b6',
        '#95a5a6'
      ],
      hoverOffset: 30
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 18,
          padding: 10,
        }
      }
    } 
  }
});
