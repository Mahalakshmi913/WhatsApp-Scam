// Sidebar navigation & section toggling
const menuItems = document.querySelectorAll('.sidebar-menu li');
const sections = document.querySelectorAll('.content-section');
const sectionTitle = document.getElementById('section-title');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;

    if (section === 'logout') {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = "/landing";
      }
      return;
    }

    // Remove active class from all menu items and sections
    menuItems.forEach(i => i.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active-section'));

    // Activate clicked menu item and corresponding section
    item.classList.add('active');
    const activeSection = document.getElementById(section);
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

// Fetch overview data
fetch('/admin/overview-data')
  .then(res => res.json())
  .then(data => {
    document.getElementById('total-reports').textContent = data.total_reports;
    document.getElementById('total-users').textContent = data.total_users;
    document.getElementById('active-reports').textContent = data.active_reports;
  })
  .catch(err => console.error('Overview fetch error:', err));

// Fetch chart data and render
fetch('/admin/chart-data')
  .then(res => res.json())
  .then(chartData => {
    // Line Chart (Reports Trend)
    new Chart(document.getElementById('reportsTrendChart').getContext('2d'), {
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
        maintainAspectRatio: false,
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

    // Doughnut Chart (Scam Types)
    new Chart(document.getElementById('scamTypeChart').getContext('2d'), {
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
        maintainAspectRatio: true,
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

// Load users and attach actions
function loadUsers() {
  fetch('/admin/users')
    .then(res => res.json())
    .then(users => {
      const tbody = document.querySelector('#userTable tbody');
      tbody.innerHTML = '';

      users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user._id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            <button class="btn-action delete-btn" data-id="${user._id}">Delete</button>
            <button class="btn-action view-btn" data-id="${user._id}">View</button>
          </td>`;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id));
      });

      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewUser(btn.dataset.id));
      });
    })
    .catch(err => console.error('Error loading users:', err));
}

function deleteUser(userId) {
  if (confirm("Are you sure you want to delete this user?")) {
    fetch(`/admin/users/${userId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "User deleted");
        loadUsers();
      })
      .catch(err => console.error('Error deleting user:', err));
  }
}

function viewUser(userId) {
  fetch(`/admin/users/${userId}`)
    .then(res => res.json())
    .then(user => {
      alert(`Name: ${user.name}\nEmail: ${user.email}`);
    })
    .catch(err => console.error('Error viewing user:', err));
}

document.addEventListener('DOMContentLoaded', loadUsers);

// Load reports
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
            ${report.evidence_url ? `<a href="${report.evidence_url}" target="_blank">
              <img src="${report.evidence_url}" alt="Evidence" style="max-width: 100px; max-height: 100px; cursor: pointer;" />
            </a>` : 'No Evidence'}
          </td>
          <td>
            <button class="btn-action delete-btn" data-id="${report.id}">Delete</button>
          </td>`;
        tbody.appendChild(row);
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const reportId = btn.dataset.id;
          if (confirm(`Delete report ID ${reportId}?`)) {
            fetch(`/admin/delete-report/${reportId}`, { method: 'DELETE' })
              .then(res => {
                if (res.ok) {
                  alert("Report deleted");
                  loadReports();
                } else {
                  alert("Failed to delete report");
                }
              })
              .catch(err => {
                console.error("Error deleting report:", err);
                alert("Error occurred");
              });
          }
        });
      });
    })
    .catch(err => console.error('Error loading reports:', err));
}

document.addEventListener('DOMContentLoaded', loadReports);

// Load feedback
function loadFeedback() {
  fetch('/admin/feedback-data')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('feedbackTableBody');
      tbody.innerHTML = '';

      data.forEach(fb => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${fb.id}</td>
          <td>${fb.email}</td>
          <td>${fb.message}</td>
          <td>${fb.submitted_at}</td>`;
        tbody.appendChild(row);
      });
    })
    .catch(err => console.error('Error loading feedback:', err));
}

document.addEventListener('DOMContentLoaded', loadFeedback);