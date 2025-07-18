// camp-deploy/public/js/youth-camp-scripts.ts

// This variable will hold the unique ID of our reCAPTCHA widget
let campRecaptchaWidgetId: number | null = null;

function initializeCampRecaptcha(): void {
  console.log("Initializing camp reCAPTCHA (v2)");

  const submitBtn = document.getElementById("submitCampFormBtn") as HTMLButtonElement | null;
  if (!submitBtn) {
    console.error("Camp form submit button not found");
    return;
  }
  if (typeof grecaptcha === "undefined" || typeof grecaptcha.render === "undefined") {
    console.error("reCAPTCHA not loaded correctly for v2 rendering.");
    return;
  }

  // Store the returned widgetId in our variable
  campRecaptchaWidgetId = grecaptcha.render(submitBtn, {
    sitekey: "6LdcG2grAAAAAKp6kKoG58Nmu0-6NPHcj7rkd6Zk",
    size: "invisible",
    badge: "bottomright",
    callback: (token: string) => {
      const recaptchaTokenInput = document.getElementById("recaptchaToken") as HTMLInputElement | null;
      if (recaptchaTokenInput) {
        recaptchaTokenInput.value = token;
      }
      void submitCampForm(); // 'void' is used to show we are intentionally not awaiting the promise
    },
  });
}

async function submitCampForm(): Promise<void> {
    const form = document.getElementById("campRegistrationForm") as HTMLFormElement;
    const submitBtn = document.getElementById("submitCampFormBtn") as HTMLButtonElement;
    const formStatus = document.getElementById("formStatus");
    const successMessage = document.getElementById("successMessage");
  
    const CLOUD_NAME = "dbkunrzye";
    const UPLOAD_PRESET = "camp_receipts";
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading Receipt...';
    if (formStatus) {
      formStatus.textContent = "Uploading your payment receipt...";
      formStatus.style.color = "blue";
    }
  
    try {
      const receiptInput = form.elements.namedItem("paymentReceipt") as HTMLInputElement;
      const receiptFile = receiptInput.files?.[0];
      if (!receiptFile) throw new Error("Payment receipt file is required.");
  
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", receiptFile);
      cloudinaryFormData.append("upload_preset", UPLOAD_PRESET);
  
      const cloudinaryResponse = await fetch(CLOUDINARY_URL, { method: "POST", body: cloudinaryFormData });
      if (!cloudinaryResponse.ok) throw new Error("Failed to upload receipt to Cloudinary");
  
      const cloudinaryData = await cloudinaryResponse.json();
      const receiptUrl = cloudinaryData.secure_url;
  
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
      if (formStatus) formStatus.textContent = "Finalizing your registration...";
  
      const backendFormData = new FormData(form);
      backendFormData.append("paymentReceiptUrl", receiptUrl);
      backendFormData.delete("paymentReceipt");
  
      const recaptchaTokenInput = document.getElementById("recaptchaToken") as HTMLInputElement;
      backendFormData.append("recaptchaToken", recaptchaTokenInput.value);
  
      const backendResponse = await fetch("https://kcmi-backend.onrender.com/api/camp-registration", { method: "POST", body: backendFormData });
      const backendData = await backendResponse.json();
      if (!backendResponse.ok || !backendData.success) throw new Error(backendData.message || "Registration failed on our server.");
  
      localStorage.setItem("lastCampSubmission", Date.now().toString());
      if (formStatus) formStatus.textContent = "";
      form.style.display = "none";
      if (successMessage) successMessage.style.display = "block";
  
    } catch (error: any) {
      if (formStatus) {
        formStatus.textContent = `Error: ${error.message}`;
        formStatus.style.color = "red";
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Register for Camp";
      if (campRecaptchaWidgetId !== null) {
          grecaptcha.reset(campRecaptchaWidgetId);
      }
    }
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("campRegistrationForm") as HTMLFormElement | null;
  const submitBtn = document.getElementById("submitCampFormBtn") as HTMLButtonElement | null;
  const formStatus = document.getElementById("formStatus");

  const setupCopyFunctionality = (spanElement: HTMLElement | null, confirmationElement: HTMLElement | null) => {
    if (spanElement && confirmationElement) {
      spanElement.addEventListener("click", async function () {
        const accountNumber = this.childNodes[0]?.textContent?.trim() || "";
        try {
          await navigator.clipboard.writeText(accountNumber);
          console.log("Account number copied:", accountNumber);
          confirmationElement.style.display = "block";
          confirmationElement.style.animation = "fadeIn 0.3s ease-in-out";
          this.style.cursor = "default";
          const iconElement = this.querySelector("i");
          if (iconElement) {
            iconElement.classList.remove("fa-copy");
            iconElement.classList.add("fa-check-circle", "text-success");
          }
          setTimeout(() => {
            confirmationElement.style.display = "none";
            this.style.cursor = "pointer";
            if (iconElement) {
              iconElement.classList.remove("fa-check-circle", "text-success");
              iconElement.classList.add("fa-copy");
            }
          }, 2000);
        } catch (err) {
          console.error("Failed to copy account number:", err);
          const errorMsg = document.createElement("div");
          errorMsg.className = "alert alert-danger mt-2";
          errorMsg.style.fontSize = "0.9em";
          errorMsg.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> Failed to copy. Please copy manually: ${accountNumber}`;
          this.parentNode?.insertBefore(errorMsg, this.nextSibling);
          setTimeout(() => errorMsg.remove(), 5000);
        }
      });
    }
  };

  const accountNumbers = [
    { element: document.getElementById("youthCampDonationAccountNumber"), confirmation: document.getElementById("youthCampDonationCopyConfirmation") },
    { element: document.getElementById("accountNumber"), confirmation: document.getElementById("copyConfirmation") },
  ];
  accountNumbers.forEach(({ element, confirmation }) => { setupCopyFunctionality(element, confirmation); });

  const benefitItems = document.querySelectorAll(".youth-camp-donation-benefits .list-group-item");
  benefitItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const icon = item.querySelector("i");
      if (icon) (icon as HTMLElement).style.transform = "scale(1.2)";
    });
    item.addEventListener("mouseleave", () => {
      const icon = item.querySelector("i");
      if (icon) (icon as HTMLElement).style.transform = "scale(1)";
    });
  });

  const donationIcon = document.querySelector(".youth-camp-donation-icon i");
  if (donationIcon) {
    setInterval(() => {
      (donationIcon as HTMLElement).style.transform = "rotate(-5deg)";
      setTimeout(() => { (donationIcon as HTMLElement).style.transform = "rotate(5deg)"; }, 1000);
      setTimeout(() => { (donationIcon as HTMLElement).style.transform = "rotate(0deg)"; }, 2000);
    }, 8000);
  }

  const paymentReceiptInput = document.getElementById("paymentReceipt") as HTMLInputElement | null;
  const dropPasteZone = document.getElementById("dropPasteZone");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const selectedFileNameSpan = document.getElementById("selectedFileName");
  const clearFileBtn = document.getElementById("clearFileBtn");
  const paymentReceiptInvalidFeedback = document.getElementById("paymentReceiptInvalidFeedback");

  function setReceiptFile(file: File | null): void {
    if (!paymentReceiptInput || !fileNameDisplay || !selectedFileNameSpan || !dropPasteZone) return;
    const dataTransfer = new DataTransfer();
    if (file) dataTransfer.items.add(file);
    paymentReceiptInput.files = dataTransfer.files;
    const fileStatusIcon = document.getElementById("fileStatusIcon");
    const fileStatusText = document.getElementById("fileStatusText");
    if (file) {
      selectedFileNameSpan.textContent = file.name;
      fileNameDisplay.style.display = "flex";
      fileNameDisplay.classList.add("file-selected-state");
      dropPasteZone.style.display = "none";
      if (fileStatusIcon && fileStatusText) {
        fileStatusIcon.className = "fas fa-check-circle text-success me-2";
        fileStatusText.textContent = "File Uploaded:";
      }
      paymentReceiptInput.classList.remove("is-invalid");
      if (paymentReceiptInvalidFeedback) paymentReceiptInvalidFeedback.style.display = "none";
    } else {
      selectedFileNameSpan.textContent = "";
      fileNameDisplay.style.display = "none";
      fileNameDisplay.classList.remove("file-selected-state");
      dropPasteZone.style.display = "flex";
      if (fileStatusIcon && fileStatusText) {
        fileStatusIcon.className = "";
        fileStatusText.textContent = "";
      }
    }
  }

  if (paymentReceiptInput && dropPasteZone) {
    const browseLink = dropPasteZone.querySelector(".browse-link");
    if (browseLink) { browseLink.addEventListener("click", (event: Event) => { event.stopPropagation(); paymentReceiptInput.click(); }); }
    paymentReceiptInput.addEventListener("change", function () { setReceiptFile(this.files && this.files.length > 0 ? this.files[0] : null); });
    dropPasteZone.addEventListener("dragover", (event: DragEvent) => { event.preventDefault(); dropPasteZone.classList.add("highlight"); });
    dropPasteZone.addEventListener("dragleave", () => { dropPasteZone.classList.remove("highlight"); });
    dropPasteZone.addEventListener("drop", (event: DragEvent) => {
      event.preventDefault();
      dropPasteZone.classList.remove("highlight");
      if (event.dataTransfer?.files.length) {
        const file = event.dataTransfer.files[0];
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
        const maxFileSize = 5 * 1024 * 1024;
        if (file && allowedTypes.includes(file.type) && file.size <= maxFileSize) {
          setReceiptFile(file);
        } else if (paymentReceiptInvalidFeedback) {
          paymentReceiptInput.classList.add("is-invalid");
          paymentReceiptInvalidFeedback.style.display = "block";
          paymentReceiptInvalidFeedback.textContent = "Invalid file. Only JPG, PNG, GIF, or PDF (max 5MB) are allowed.";
        }
      }
    });
  }

  document.addEventListener("paste", (event: ClipboardEvent) => {
    if (!dropPasteZone || window.getComputedStyle(dropPasteZone).display === "none") return;
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) setReceiptFile(file);
        break;
      }
    }
  });

  if (clearFileBtn) {
    clearFileBtn.addEventListener("click", () => {
      setReceiptFile(null);
      if (paymentReceiptInput) paymentReceiptInput.classList.remove("is-invalid");
      if (paymentReceiptInvalidFeedback) paymentReceiptInvalidFeedback.style.display = "none";
    });
  }

  if (form && submitBtn) {
    form.addEventListener("submit", function (event: Event) {
      event.preventDefault();
      if (formStatus) {
        formStatus.textContent = "";
        formStatus.className = "mt-3 text-center fw-bold fs-5";
      }
      Array.from(form.elements).forEach(el => (el as HTMLElement).classList.remove("is-invalid"));
      let isValid = true;
      const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
      const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
      const phoneNumber = (form.elements.namedItem("phoneNumber") as HTMLInputElement).value.trim();
      const numPeople = parseInt((form.elements.namedItem("numPeople") as HTMLInputElement).value);
      const paymentReceipt = (form.elements.namedItem("paymentReceipt") as HTMLInputElement).files?.[0];
      if (!fullName) { (form.elements.namedItem("fullName") as HTMLInputElement).classList.add("is-invalid"); isValid = false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { (form.elements.namedItem("email") as HTMLInputElement).classList.add("is-invalid"); isValid = false; }
      if (!phoneNumber || !/^\+?[0-9\s-]{7,15}$/.test(phoneNumber)) { (form.elements.namedItem("phoneNumber") as HTMLInputElement).classList.add("is-invalid"); isValid = false; }
      if (isNaN(numPeople) || numPeople < 1) { (form.elements.namedItem("numPeople") as HTMLInputElement).classList.add("is-invalid"); isValid = false; }
      if (!paymentReceipt) { (form.elements.namedItem("paymentReceipt") as HTMLInputElement).classList.add("is-invalid"); const feedback = document.getElementById("paymentReceiptInvalidFeedback"); if (feedback) feedback.style.display = "block"; isValid = false; }
      if (!isValid) { if (formStatus) { formStatus.textContent = "Please correct the errors in the form."; formStatus.style.color = "red"; } return; }
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
      if (formStatus) { formStatus.textContent = "Verifying with reCAPTCHA..."; formStatus.style.color = "blue"; }
      
      if (campRecaptchaWidgetId !== null) {
          grecaptcha.execute(campRecaptchaWidgetId);
      } else {
          console.error("reCAPTCHA widget ID not available.");
      }
    });
  }

  document.querySelectorAll(".accordion").forEach((accordion) => {
    accordion.addEventListener("shown.bs.collapse", function (e: Event) {
      const openedItem = e.target as HTMLElement;
      const currentScroll = window.scrollY;
      requestAnimationFrame(() => {
        const itemOffset = openedItem.getBoundingClientRect().top + currentScroll;
        window.scrollTo({ top: itemOffset - 200, behavior: "smooth" });
      });
    });
  });

  function highlightDonationSection(): void {
    const donationSection = document.querySelector(".youth-camp-donation-prompt-prominent");
    if (donationSection) {
      (donationSection as HTMLElement).style.boxShadow = "0 0 0 3px rgba(124, 25, 99, 0.3)";
      setTimeout(() => { (donationSection as HTMLElement).style.boxShadow = "" }, 1000);
    }
  }
  setTimeout(highlightDonationSection, 1500);
});