document.getElementById("signupForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const message = document.getElementById("message");

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      message.style.color = "green";
      message.textContent = result.message;
      
      // Redirect to login page after successful signup
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
});
