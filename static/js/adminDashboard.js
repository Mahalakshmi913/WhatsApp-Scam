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

// Fetch overview data from backend
fetch('/admin/overview-data')
  .then(res => res.json())
  .then(data => {
    document.getElementById('total-reports').textContent = data.total_reports;
    document.getElementById('total-users').textContent = data.total_users;
    document.getElementById('active-reports').textContent = data.active_reports;
  })
  .catch(err => console.error('Overview fetch error:', err));

// Fetch chart data from backend
fetch('/admin/chart-data')
  .then(res => res.json())
  .then(chartData => {
    // Reports trend chart (line)
    const reportsTrendCtx = document.getElementById('reportsTrendChart').getContext('2d');
    new Chart(reportsTrendCtx, {
      type: 'line',
      data: {
        labels: chartData.trend.labels,
        datasets: [{
          label: 'Reports',
          data: chartData.trend.values,
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

    // Scam type distribution chart (doughnut)
    const scamTypeCtx = document.getElementById('scamTypeChart').getContext('2d');
    new Chart(scamTypeCtx, {
      type: 'doughnut',
      data: {
        labels: chartData.types.labels,
        datasets: [{
          label: 'Scam Types',
          data: chartData.types.values,
          backgroundColor: ['#e67e22', '#3498db', '#9b59b6', '#95a5a6'],
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
  })
  .catch(err => console.error('Chart data fetch error:', err));
 
  function loadUsers() {
    fetch('/admin/users')
      .then(res => res.json())
      .then(users => {
        const tbody = document.querySelector('#userTable tbody');
        tbody.innerHTML = ''; // Clear any existing rows

        users.forEach(user => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${user._id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
              <button class="btn-action">Delete</button>
              <button class="btn-action">View</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => console.error('Error fetching user data:', err));
  }

  document.addEventListener('DOMContentLoaded', loadUsers);

  function loadReports() {
  fetch('/admin/reports-data')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('reportTableBody');
      tbody.innerHTML = '';

      data.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${report.id}</td>
          <td>${report.phone}</td>
          <td>${report.scam_type}</td>
          <td>${report.description}</td>
          <td>${report.date}</td>
          <td>
            <button class="btn-action">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => console.error('Error fetching reports:', err));
}

document.addEventListener('DOMContentLoaded', loadReports);