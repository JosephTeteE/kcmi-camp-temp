// camp-deploy/public/js/scripts.ts
// This file contains the JavaScript code for the camp deployment website.
// It handles the navbar toggling, dark mode toggle, WhatsApp number copy functionality,
// and the reCAPTCHA integration for the WhatsApp subscription form.

function onLoadRecaptcha(): void {
  console.log("Initializing reCAPTCHA (v3 functionality)");

  try {
    const whatsappForm = document.getElementById("whatsappSubscriptionForm") as HTMLFormElement;
    if (whatsappForm) {
      console.log("Found WhatsApp subscription form. Adding event listener.");
      whatsappForm.addEventListener("submit", async (event: Event) => {
        event.preventDefault();
        const emailInput = document.getElementById("whatsappEmail") as HTMLInputElement;
        const email = emailInput.value;
        try {
          console.log("Generating reCAPTCHA token for subscription form...");
        
          const recaptchaToken = await grecaptcha.execute(
            "6LcRdOsqAAAAAMzghoNjWqpTB3AjOBayn8KIpxac", // v3 Site key
            { action: "submit_subscription" }
          );

          console.log("reCAPTCHA token generated:", recaptchaToken);
          const response = await fetch(
            "https://kcmi-backend.onrender.com/subscribe",
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
          const data = await response.json();
          alert(data.message);
          if (data.success) {
            const modalElement = document.getElementById("whatsappModal");
            const modal = bootstrap.Modal.getInstance(modalElement);
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
  } catch (error) {
    console.error("reCAPTCHA initialization error:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const navbarToggler = document.querySelector(".navbar-toggler") as HTMLElement;
  const body = document.body;

  if (navbarToggler) {
    navbarToggler.addEventListener("click", function () {
      body.classList.toggle("navbar-open");
    });
  }

  document.addEventListener("click", function (event: MouseEvent) {
    const navbar = document.querySelector(".navbar-collapse") as HTMLElement;

    if (
      navbar &&
      navbarToggler &&
      !navbar.contains(event.target as Node) &&
      !navbarToggler.contains(event.target as Node)
    ) {
      if (navbar.classList.contains("show")) {
        const bsCollapse = new bootstrap.Collapse(navbar);
        bsCollapse.hide();
        body.classList.remove("navbar-open");
      }
    }
  });

  const whatsappNumberElement = document.getElementById("DFRwhatsappNumber") as HTMLElement;
  if (whatsappNumberElement) {
    whatsappNumberElement.addEventListener("click", function () {
      const number = this.textContent?.trim() || "";

      navigator.clipboard
        .writeText(number)
        .then(() => {
          const originalText = this.textContent || "";
          this.textContent = "Copied to Clipboard!";
          setTimeout(() => {
            this.textContent = originalText;
          }, 1000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          alert("Failed to copy WhatsApp number. Please try again.");
        });
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById("darkModeToggle") as HTMLElement;
  const darkIcon = document.getElementById("darkIcon") as HTMLElement;
  const lightIcon = document.getElementById("lightIcon") as HTMLElement;
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

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