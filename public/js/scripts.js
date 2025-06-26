// camp-deploy/public/js/scripts.js

// =========================================================================
// === Initialize reCAPTCHA for Contact & Subscription Forms ===
//
// Purpose: This section handles the initialization and execution of Google
// reCAPTCHA v3 for both the contact form and the WhatsApp subscription form
// to prevent spam submissions.
// =========================================================================
function onLoadRecaptcha() {
  console.log("Initializing reCAPTCHA...");

  try {
    grecaptcha.ready(function () {
      console.log("reCAPTCHA API is ready.");

      // --- WhatsApp Subscription Form reCAPTCHA ---
      const whatsappForm = document.getElementById("whatsappSubscriptionForm");
      if (whatsappForm) {
        console.log(
          "Found WhatsApp subscription form. Adding event listener for reCAPTCHA on submit."
        );
        whatsappForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const email = document.getElementById("whatsappEmail").value;
          try {
            console.log("Generating reCAPTCHA token for subscription form...");
            const recaptchaToken = await grecaptcha.execute(
              "6LcRdOsqAAAAAMzghoNjWqpTB3AjOBayn8KIpxac", // Site key - DO NOT HARDCODE SENSITIVE INFO IN PRODUCTION
              { action: "submit_subscription" }
            );
            console.log("reCAPTCHA token generated:", recaptchaToken);
            console.log("Submitting subscription form data...");
            const response = await fetch(
              "https://kcmi-backend.onrender.com/subscribe", // Backend API endpoint
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: email,
                  subscriptionType: "whatsapp",
                  recaptchaToken: recaptchaToken,
                }),
              }
            );
            console.log("Subscription form response status:", response.status);
            const data = await response.json();
            console.log("Subscription form response data:", data);
            alert(data.message);
            if (data.success) {
              const modal = bootstrap.Modal.getInstance(
                document.getElementById("whatsappModal")
              );
              if (modal) {
                modal.hide();
                whatsappForm.reset();
              }
            }
          } catch (error) {
            console.error("Subscription Error:", error);
            alert("An error occurred. Please try again.");
          }
        });
      } else {
        console.warn("WhatsApp subscription form not found.");
      }
    });
  } catch (error) {
    console.error("reCAPTCHA initialization error:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================================================
  // === Navbar Toggler and Click-Outside-to-Close Logic ===
  //
  // Purpose: Handles the behavior of the mobile navbar. When the toggler button
  // is clicked, it adds/removes a class to open/close the navbar. Additionally,
  // it adds an event listener to close the navbar when the user clicks outside
  // of it.
  // ==========================================================================
  const navbarToggler = document.querySelector(".navbar-toggler");
  const body = document.body;

  if (navbarToggler) {
    navbarToggler.addEventListener("click", function () {
      body.classList.toggle("navbar-open"); // Class to control body overflow and potential styling
    });
  }

  document.addEventListener("click", function (event) {
    const navbar = document.querySelector(".navbar-collapse");

    if (
      navbar &&
      navbarToggler &&
      !navbar.contains(event.target) &&
      !navbarToggler.contains(event.target)
    ) {
      if (navbar.classList.contains("show")) {
        const bsCollapse = new bootstrap.Collapse(navbar); // Bootstrap collapse object

        bsCollapse.hide();
        body.classList.remove("navbar-open");
      }
    }
  });

  // ==========================================================================
  // === Click-to-Copy WhatsApp Number Functionality ===
  //
  // Purpose: Makes the WhatsApp number clickable and copies it to the user's
  // clipboard when clicked. Provides visual feedback to the user upon successful copy.
  // ==========================================================================
  const whatsappNumberElement = document.getElementById("DFRwhatsappNumber");

  if (whatsappNumberElement) {
    whatsappNumberElement.addEventListener("click", function () {
      const number = this.textContent.trim();

      navigator.clipboard
        .writeText(number)
        .then(() => {
          const originalText = this.textContent;
          this.textContent = "Copied to Clipboard!";
          setTimeout(() => {
            this.textContent = originalText;
          }, 1000); // Revert text after 1 second
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          alert("Failed to copy WhatsApp number. Please try again.");
        });
    });
  }
});

// ==========================================================================
// Dark Mode Toggle
//
// Purpose: Implements the dark mode toggle functionality. It checks the user's
// system preference and local storage to set the initial theme. It also
// handles the click event of the toggle button to switch between light and
// dark modes and stores the user's preference in local storage.
// ==========================================================================
document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const darkIcon = document.getElementById("darkIcon");
  const lightIcon = document.getElementById("lightIcon");
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Check local storage for dark mode preference, or system preference if none is set
  if (
    localStorage.getItem("darkMode") === "enabled" ||
    (prefersDarkMode && localStorage.getItem("darkMode") !== "disabled")
  ) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    if (darkIcon) darkIcon.style.display = "none";
    if (lightIcon) lightIcon.style.display = "inline";
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function () {
      const isDarkMode =
        document.documentElement.getAttribute("data-bs-theme") === "dark";
      document.documentElement.setAttribute(
        "data-bs-theme",
        isDarkMode ? "light" : "dark"
      );

      if (isDarkMode) {
        localStorage.setItem("darkMode", "disabled");
        if (darkIcon) darkIcon.style.display = "inline";
        if (lightIcon) lightIcon.style.display = "none";
      } else {
        localStorage.setItem("darkMode", "enabled");
        if (darkIcon) darkIcon.style.display = "none";
        if (lightIcon) lightIcon.style.display = "inline";
      }
    });
  }
});
