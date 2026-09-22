(function () {
  "use strict";

  var CONFIG = window.SPORTLAND_CONFIG;

  var headerEl = document.querySelector(".header");
  var stepBranchEl = document.getElementById("step-branch");
  var stepPositionEl = document.getElementById("step-position");
  var branchOptionsEl = document.getElementById("branch-options");
  var positionOptionsEl = document.getElementById("position-options");
  var positionStepBranchNameEl = document.getElementById("position-step-branch-name");
  var backToBranchBtn = document.getElementById("back-to-branch");

  var applySection = document.getElementById("apply-section");
  var successSection = document.getElementById("success-section");
  var selectedPositionEl = document.getElementById("selected-position");
  var selectedBranchEl = document.getElementById("selected-branch");
  var form = document.getElementById("apply-form");
  var submitBtn = document.getElementById("submit-btn");
  var submitBtnText = document.getElementById("submit-btn-text");
  var statusEl = document.getElementById("form-status");
  var backBtn = document.getElementById("back-btn");
  var restartBtn = document.getElementById("restart-btn");
  var resumeInput = document.getElementById("resume");
  var fileDropText = document.getElementById("file-drop-text");
  var fileDrop = document.getElementById("file-drop");

  var isSubmitting = false;
  var currentBranch = null;

  function showScreen(screenName) {
    stepBranchEl.hidden = screenName !== "branch";
    stepPositionEl.hidden = screenName !== "position";
    applySection.hidden = screenName !== "form";
    successSection.hidden = screenName !== "success";
    headerEl.hidden = screenName === "form" || screenName === "success";
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function createOptionButton(label, onSelect) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";

    var text = document.createElement("span");
    text.textContent = label;
    btn.appendChild(text);

    var arrow = document.createElement("span");
    arrow.className = "option__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "←";
    btn.appendChild(arrow);

    btn.addEventListener("click", onSelect);
    return btn;
  }

  function renderBranchOptions() {
    branchOptionsEl.innerHTML = "";
    CONFIG.branches.forEach(function (branch) {
      var btn = createOptionButton(branch.name, function () {
        selectBranch(branch);
      });
      branchOptionsEl.appendChild(btn);
    });
  }

  function selectBranch(branch) {
    currentBranch = branch;
    positionStepBranchNameEl.textContent = branch.name;
    renderPositionOptions(branch);
    showScreen("position");
  }

  function renderPositionOptions(branch) {
    positionOptionsEl.innerHTML = "";
    branch.positions.forEach(function (position) {
      var btn = createOptionButton(position.name, function () {
        openApplyForm(branch, position);
      });
      positionOptionsEl.appendChild(btn);
    });
  }

  function openApplyForm(branch, position) {
    document.getElementById("branchId").value = branch.id;
    document.getElementById("branchName").value = branch.name;
    document.getElementById("positionId").value = position.id;
    document.getElementById("positionName").value = position.name;

    selectedPositionEl.textContent = position.name;
    selectedBranchEl.textContent = branch.name;

    clearErrors();
    statusEl.textContent = "";
    statusEl.className = "form__status";

    showScreen("form");
  }

  function resetFileDrop() {
    fileDropText.textContent = "לחצו כדי לצרף קובץ (PDF, DOC, DOCX — עד 10MB)";
    fileDrop.classList.remove("has-file");
  }

  function clearErrors() {
    ["fullName", "phone", "email", "resume"].forEach(function (id) {
      setFieldError(id, "");
    });
  }

  function setFieldError(fieldId, message) {
    var errEl = document.getElementById("err-" + fieldId);
    var fieldEl = document.getElementById(fieldId);
    if (errEl) errEl.textContent = message;
    var fieldWrap = fieldEl ? fieldEl.closest(".field") : null;
    if (fieldWrap) {
      fieldWrap.classList.toggle("has-error", !!message);
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    var digits = value.replace(/[\s-]/g, "");
    return /^0\d{8,9}$/.test(digits) || /^\+?\d{9,13}$/.test(digits);
  }

  function validateFile(file) {
    if (!file) return "יש לצרף קובץ קורות חיים";

    var ext = "." + file.name.split(".").pop().toLowerCase();
    var okExt = CONFIG.upload.acceptedExtensions.indexOf(ext) !== -1;
    var okMime = CONFIG.upload.acceptedMimeTypes.indexOf(file.type) !== -1;

    if (!okExt && !okMime) {
      return "יש להעלות קובץ מסוג PDF, DOC או DOCX בלבד";
    }

    var maxBytes = CONFIG.upload.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return "גודל הקובץ חייב להיות עד " + CONFIG.upload.maxSizeMB + "MB";
    }

    return "";
  }

  function validateForm() {
    var valid = true;

    var fullName = document.getElementById("fullName").value.trim();
    if (!fullName) {
      setFieldError("fullName", "שדה חובה");
      valid = false;
    }

    var phone = document.getElementById("phone").value.trim();
    if (!phone) {
      setFieldError("phone", "שדה חובה");
      valid = false;
    } else if (!isValidPhone(phone)) {
      setFieldError("phone", "מספר טלפון לא תקין");
      valid = false;
    }

    var email = document.getElementById("email").value.trim();
    if (!email) {
      setFieldError("email", "שדה חובה");
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError("email", "כתובת אימייל לא תקינה");
      valid = false;
    }

    var file = resumeInput.files[0];
    var fileError = validateFile(file);
    if (fileError) {
      setFieldError("resume", fileError);
      valid = false;
    }

    return valid;
  }

  resumeInput.addEventListener("change", function () {
    var file = resumeInput.files[0];
    if (file) {
      var error = validateFile(file);
      if (error) {
        setFieldError("resume", error);
        resetFileDrop();
        resumeInput.value = "";
      } else {
        setFieldError("resume", "");
        fileDropText.textContent = file.name;
        fileDrop.classList.add("has-file");
      }
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (isSubmitting) return;

    clearErrors();
    statusEl.textContent = "";
    statusEl.className = "form__status";

    // honeypot: אם מולא - כנראה בוט. מתעלמים בשקט.
    var honeypot = document.getElementById("website").value;
    if (honeypot) {
      statusEl.textContent = "תודה! קיבלנו את קורות החיים שלך וניצור קשר אם תימצא התאמה.";
      form.reset();
      return;
    }

    if (!validateForm()) {
      statusEl.textContent = "יש לתקן את השדות המסומנים";
      statusEl.className = "form__status is-error";
      return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtnText.textContent = "שולח...";
    statusEl.textContent = "שולח את קורות החיים שלך, רגע בבקשה...";
    statusEl.className = "form__status is-loading";

    var formData = new FormData(form);

    fetch(CONFIG.apiUrl, {
      method: "POST",
      body: formData
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().catch(function () {
            return {};
          }).then(function (data) {
            throw new Error(data.message || "אירעה שגיאה בשליחה");
          });
        }
        return response.json();
      })
      .then(function () {
        if (typeof fbq === "function") {
          fbq("track", "Lead");
        }
        showScreen("success");
      })
      .catch(function (err) {
        statusEl.textContent = "השליחה נכשלה. " + (err.message || "נסו שוב בעוד רגע.") + " ניתן גם לנסות שוב או לפנות אלינו טלפונית.";
        statusEl.className = "form__status is-error";
      })
      .finally(function () {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtnText.textContent = "שליחת קורות חיים";
      });
  });

  backToBranchBtn.addEventListener("click", function () {
    currentBranch = null;
    showScreen("branch");
  });

  backBtn.addEventListener("click", function () {
    form.reset();
    resetFileDrop();
    clearErrors();
    if (currentBranch) {
      renderPositionOptions(currentBranch);
      showScreen("position");
    } else {
      showScreen("branch");
    }
  });

  restartBtn.addEventListener("click", function () {
    form.reset();
    resetFileDrop();
    clearErrors();
    currentBranch = null;
    showScreen("branch");
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  renderBranchOptions();
})();
