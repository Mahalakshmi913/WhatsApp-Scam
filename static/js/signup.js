document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");

  // Restrict non-digit input in phone field
  document.getElementById("phone").addEventListener("keypress", (e) => {
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  });

  // Live validation on input
  form.addEventListener("input", (e) => {
    const id = e.target.id;
    const validator = window[`validate${capitalize(id)}`];
    if (typeof validator === "function") {
      validator();
    }
  });

  // Form submit handling
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Perform validations
    validateName();
    validateUsername();
    validatePassword();
    validatePhone();
    validateEmail();

    const errors = document.querySelectorAll(".error-msg:not(:empty)");
    const message = document.getElementById("message");

    if (errors.length === 0) {
      // ✅ Backend submission using Fetch (your logic)
      const formData = new FormData(form);

      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          message.style.color = "green";
          message.textContent = result.message;

          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        } else {
          message.style.color = "red";
          message.textContent = result.message;
        }
      } catch (error) {
        message.style.color = "red";
        message.textContent = "Something went wrong.";
        console.error(error);
      }

    } else {
      message.textContent = "Please correct the errors above.";
      message.style.color = "red";
    }
  });

  // --- Validation Functions ---
  function validateName() {
    const field = document.getElementById("name");
    const value = field.value.trim();
    showValidation(value.length >= 3 && /^[A-Za-z ]+$/.test(value), "name", "Name must be at least 3 letters and only letters/spaces");
  }

  function validateUsername() {
    const field = document.getElementById("username");
    const value = field.value.trim();
    showValidation(/^[a-zA-Z0-9_]{3,}$/.test(value), "username", "Username must be 3+ characters, letters, numbers, or _ only");
  }

  function validatePassword() {
    const field = document.getElementById("password");
    const value = field.value.trim();
    showValidation(/(?=.*[!@#$%^&*])(?=.*\d).{6,}/.test(value), "password", "Min 6 characters, 1 special symbol & number");
  }

  function validatePhone() {
    const field = document.getElementById("phone");
    const value = field.value.trim();
    showValidation(/^[6-9]\d{9}$/.test(value), "phone", "Enter a valid 10-digit number starting with 6-9");
  }

  function validateEmail() {
    const field = document.getElementById("email");
    const value = field.value.trim();
    showValidation(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value), "email", "Enter a valid email address");
  }

  // --- Helper Functions ---
  function showValidation(isValid, fieldId, errorMsg) {
    const statusIcon = document.getElementById(`${fieldId}Status`);
    const errorText = document.getElementById(`${fieldId}Error`);
    if (isValid) {
      statusIcon.className = "fas fa-check-circle status-icon success";
      errorText.textContent = "";
    } else {
      statusIcon.className = "fas fa-times-circle status-icon error";
      errorText.textContent = errorMsg;
    }
    statusIcon.style.display = "inline";
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- 3D Tilt Animation for Cards ---
  document.querySelectorAll('.signup-cards .card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * 10;
      const rotateY = ((x - centerX) / centerX) * 12;
      card.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.18s cubic-bezier(.5,1.7,.55,.95)';
    });

    card.addEventListener('focus', () => {
      card.style.boxShadow = '0 20px 48px rgba(38,166,154,0.22)';
      card.style.transform = 'scale(1.09)';
    });

    card.addEventListener('blur', () => {
      card.style.boxShadow = '';
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });
});
