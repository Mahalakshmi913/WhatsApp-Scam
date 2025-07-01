 document.getElementById("loginForm").addEventListener("submit", async function(e) {
      e.preventDefault();

      const formData = new FormData(this);
      const message = document.getElementById("message");

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          message.style.color = "green";
          message.textContent = result.message;
          // Redirect to home page after successful login
          setTimeout(() => {
            window.location.href = "/homePage";
          }, 1000);
          
        } else {
          message.style.color = "red";
          message.textContent = result.message;
        }
      } catch (error) {
        message.style.color = "red";
        message.textContent = "Something went wrong. Try again later.";
        console.error("Login error:", error);
      }
    });