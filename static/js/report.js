const scamType = document.getElementById("scamType");
const otherScam = document.getElementById("otherScamType");
const form = document.getElementById("scamForm");
const messageDiv = document.getElementById("formMessage");
const submitBtn = form.querySelector('button[type="submit"]');

// Progress bar
const progressBar = document.getElementById('progressBar');
const requiredFields = [
  document.getElementById('phone'),
  document.getElementById('scamType'),
  document.getElementById('description'),
  document.getElementById('captcha'),
  document.getElementById('terms')
];

// Help popup
const helpBtn = document.getElementById('helpBtn');
const helpPopup = document.getElementById('helpPopup');
const closeHelp = document.getElementById('closeHelp');

if (helpBtn && helpPopup && closeHelp) {
  helpBtn.addEventListener('click', () => helpPopup.style.display = 'block');
  closeHelp.addEventListener('click', () => helpPopup.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === helpPopup) helpPopup.style.display = 'none';
  });
}

// Max date for date input
const dateInput = document.getElementById("date");
if (dateInput) {
  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.max = todayStr;
}

// Show/hide 'Others' input
scamType.addEventListener("change", () => {
  otherScam.style.display = scamType.value === "Others" ? "block" : "none";
  if (scamType.value !== "Others") clearError(otherScam);
});

// Phone number numeric only
const phoneInput = document.getElementById("phone");
phoneInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Live phone validation
phoneInput.addEventListener('input', () => {
  if (!/^[6-9]\d{9}$/.test(phoneInput.value)) {
    phoneInput.setCustomValidity('Enter a valid 10-digit Indian mobile number.');
  } else {
    phoneInput.setCustomValidity('');
  }
});

// Live date validation
if (dateInput) {
  dateInput.addEventListener('input', () => {
    const picked = new Date(dateInput.value);
    const today = new Date();
    picked.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    dateInput.setCustomValidity(picked > today ? 'Date cannot be in the future.' : '');
  });
}

// Update progress bar
function updateProgressBar() {
  let filled = 0;
  requiredFields.forEach(field => {
    if (field.type === 'checkbox') {
      if (field.checked) filled++;
    } else if (field.value && (field.id !== 'scamType' || field.value !== '')) {
      filled++;
    }
  });
  const percent = Math.round((filled / requiredFields.length) * 100);
  progressBar.style.width = percent + '%';
  progressBar.setAttribute('aria-valuenow', percent);
}
requiredFields.forEach(field => {
  field.addEventListener('input', updateProgressBar);
  field.addEventListener('change', updateProgressBar);
});
updateProgressBar();

// Error display helpers
function showError(input, msg) {
  let errorElem = input.nextElementSibling;
  if (!errorElem || !errorElem.classList.contains('error-message')) {
    errorElem = document.createElement('div');
    errorElem.classList.add('error-message');
    errorElem.style.color = 'yellow';
    errorElem.style.fontSize = '0.85rem';
    errorElem.style.marginTop = '0.3rem';
    input.parentNode.insertBefore(errorElem, input.nextSibling);
  }
  errorElem.textContent = msg;
  input.style.borderColor = '#ff4d4d';
}

function clearError(input) {
  let errorElem = input.nextElementSibling;
  if (errorElem && errorElem.classList.contains('error-message')) errorElem.remove();
  input.style.borderColor = '';
}

// Form submission
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  messageDiv.textContent = "";
  messageDiv.style.color = "";

  [...form.elements].forEach(el => clearError(el));

  const phone = phoneInput.value.trim();
  const selectedScamType = scamType.value;
  const otherScamText = otherScam.value.trim();
  const descriptionInput = document.getElementById("description");
  const description = descriptionInput.value.trim();
  const fileInput = document.getElementById("evidence");
  const file = fileInput.files[0];
  const contactInput = document.getElementById("contact");
  const contact = contactInput.value.trim();
  const captcha = document.getElementById("captcha").checked;
  const terms = document.getElementById("terms").checked;

  let valid = true;

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showError(phoneInput, "Please enter a valid 10-digit Indian mobile number.");
    valid = false;
  }

  if (!selectedScamType) {
    showError(scamType, "Please select the type of scam.");
    valid = false;
  }

  if (selectedScamType === "Others" && otherScamText.length < 3) {
    showError(otherScam, "Please specify the scam type.");
    valid = false;
  }

  if (description.length < 20) {
    showError(descriptionInput, "Description must be at least 20 characters.");
    valid = false;
  }

  if (dateInput && dateInput.value) {
    const picked = new Date(dateInput.value);
    const today = new Date();
    picked.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (picked > today) {
      showError(dateInput, "Incident date cannot be in the future.");
      valid = false;
    }
  }

  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showError(fileInput, "Only JPEG, PNG, or PDF files allowed.");
      valid = false;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError(fileInput, "File must be under 2MB.");
      valid = false;
    }
  }

  if (contact && !/^(\+91)?[6-9]\d{9}$|^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(contact)) {
    showError(contactInput, "Enter a valid phone number or email.");
    valid = false;
  }

  if (!captcha) {
    showError(document.getElementById("captcha"), "Please confirm you're not a robot.");
    valid = false;
  }

  if (!terms) {
    showError(document.getElementById("terms"), "You must confirm the details are true.");
    valid = false;
  }

  if (!valid) {
    messageDiv.style.color = "#ffcc00";
    messageDiv.textContent = "Please fix the highlighted errors and try again.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const formData = new FormData(form);

  try {
    const response = await fetch('/api/report', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.status === "success") {
      messageDiv.style.color = "lightgreen";
      messageDiv.textContent = "✅ Thank you! Your report has been submitted.";
      form.reset();
      otherScam.style.display = "none";

      setTimeout(() => {
      window.location.href = '/homePage';
      }, 2000);
      updateProgressBar();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = result.message || "Something went wrong.";
    }
  } catch (err) {
    messageDiv.style.color = "red";
    messageDiv.textContent = "Failed to submit report.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Report";
  }
});
