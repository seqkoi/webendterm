const state = {
  cat: "all",
  query: "",
  sort: "default",
  cart: 0,
  tipsShown: 0,
  imageIndex: 0,
  step: 0,
  userName: "",
  lastSound: 0,
  colorIndex: 0
};

const palettes = {
  day: ["#f5f7fb", "#fde8d7", "#e3f0ff", "#f3e5f5", "#e8f5e9", "#fff8d6"],
  night: ["#0f172a", "#1b1033", "#0b2a2a", "#2a1414", "#14231a", "#26220f"]
};

let audioContext = null;

function playSound(type) {
  const now = performance.now();
  if (now - state.lastSound < 90) return;
  state.lastSound = now;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  audioContext = audioContext || new AudioCtx();
  let notes;
  switch (type) {
    case "add":
      notes = [660, 880];
      break;
    case "success":
      notes = [523, 659, 784];
      break;
    case "error":
      notes = [220];
      break;
    case "swap":
      notes = [740];
      break;
    default:
      notes = [440];
  }
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * 0.09;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.22);
  });
}

function retrigger(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function highlightNav() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === file);
  });
}

function setTheme(isNight) {
  const button = document.querySelector("#themeBtn");
  document.body.classList.toggle("night", isNight);
  document.body.style.backgroundColor = "";
  state.colorIndex = 0;
  button.textContent = isNight ? "Day" : "Night";
  button.setAttribute("aria-pressed", String(isNight));
  try {
    localStorage.setItem("techworldTheme", isNight ? "night" : "day");
  } catch (error) {
    return;
  }
}

function updateCartBadge() {
  const badge = document.querySelector("#cartCount");
  badge.textContent = state.cart;
  retrigger(badge, "pop");
  try {
    sessionStorage.setItem("techworldCart", state.cart);
  } catch (error) {
    return;
  }
}

function handleNavKeys(event) {
  const links = Array.from(document.querySelectorAll("#mainNav a"));
  const index = links.indexOf(document.activeElement);
  if (index === -1) return;
  let target = null;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      target = links[(index + 1) % links.length];
      break;
    case "ArrowLeft":
    case "ArrowUp":
      target = links[(index - 1 + links.length) % links.length];
      break;
    case "Home":
      target = links[0];
      break;
    case "End":
      target = links[links.length - 1];
      break;
    default:
      return;
  }
  event.preventDefault();
  target.focus();
}

function initCommon() {
  const themeButton = document.querySelector("#themeBtn");
  const toTop = document.querySelector("#toTop");
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("techworldTheme");
    state.cart = Number(sessionStorage.getItem("techworldCart")) || 0;
  } catch (error) {
    savedTheme = null;
  }
  document.querySelector("#cartCount").textContent = state.cart;
  setTheme(savedTheme === "night");
  highlightNav();

  themeButton.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("night"));
    playSound("click");
  });

  document.querySelector("#mainNav").addEventListener("keydown", handleNavKeys);

  document.addEventListener("keydown", event => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    switch (event.key.toLowerCase()) {
      case "t":
        setTheme(!document.body.classList.contains("night"));
        break;
      default:
        break;
    }
  });

  window.addEventListener("scroll", () => {
    toTop.style.display = window.scrollY > 300 ? "block" : "none";
  });
}

function getPeriod() {
  const hour = new Date().getHours();
  switch (true) {
    case hour < 12:
      return "Good morning";
    case hour < 18:
      return "Good afternoon";
    default:
      return "Good evening";
  }
}

function updateGreeting() {
  const greeting = document.querySelector("#greeting");
  const base = getPeriod();
  greeting.textContent = state.userName ? base + ", " + state.userName + "!" : base + "!";
  retrigger(greeting, "pop");
}

function createTip(tip) {
  const article = document.createElement("article");
  const title = document.createElement("h4");
  const body = document.createElement("p");
  article.className = "tip";
  title.textContent = tip.title;
  body.textContent = tip.body;
  article.append(title, body);
  return article;
}

function appendTips(list) {
  const container = document.querySelector("#tipList");
  list.forEach(tip => container.appendChild(createTip(tip)));
  state.tipsShown += list.length;
}

function loadTips() {
  const status = document.querySelector("#tipStatus");
  const button = document.querySelector("#loadTips");
  const remaining = techTips.slice(state.tipsShown, state.tipsShown + 2);
  if (remaining.length === 0) {
    status.textContent = "That is all the tips for today.";
    button.disabled = true;
    return;
  }
  status.textContent = "Loading...";
  fetch("https://jsonplaceholder.typicode.com/posts?_limit=1")
    .then(response => {
      if (!response.ok) throw new Error("Request failed");
      return response.json();
    })
    .then(() => {
      status.textContent = "";
      appendTips(remaining);
    })
    .catch(() => {
      status.textContent = "Offline mode: showing saved tips.";
      appendTips(remaining);
    })
    .finally(() => {
      playSound("click");
      if (state.tipsShown >= techTips.length) button.disabled = true;
    });
}

function initHome() {
  const nameForm = document.querySelector("#nameForm");
  const nameInput = document.querySelector("#nameInput");
  const timeButton = document.querySelector("#timeBtn");
  const timeOutput = document.querySelector("#timeOutput");
  const heroToggle = document.querySelector("#heroToggle");
  const heroMore = document.querySelector("#heroMore");

  updateGreeting();
  initHomeExtras();

  nameForm.addEventListener("submit", event => {
    event.preventDefault();
    state.userName = nameInput.value.trim();
    updateGreeting();
    playSound("click");
  });

  timeButton.addEventListener("click", () => {
    timeOutput.textContent = new Date().toLocaleTimeString();
    retrigger(timeOutput, "pop");
    playSound("click");
  });

  heroToggle.addEventListener("click", () => {
    const hidden = getComputedStyle(heroMore).display === "none";
    heroMore.style.display = hidden ? "block" : "none";
    heroToggle.textContent = hidden ? "Show less" : "Show more";
    playSound("click");
  });

  document.querySelector("#loadTips").addEventListener("click", loadTips);
}

function matchesCategory(product) {
  switch (state.cat) {
    case "all":
      return true;
    case "budget":
      return product.price < 100;
    default:
      return product.cat === state.cat;
  }
}

function sortProducts(list) {
  switch (state.sort) {
    case "low":
      return list.sort((a, b) => a.price - b.price);
    case "high":
      return list.sort((a, b) => b.price - a.price);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list;
  }
}

function productCard(product) {
  return `
    <article class="product">
      <img src="images/tech${product.img}.svg" alt="${product.name}">
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        <span class="price">$${product.price}</span>
        <div class="product-actions">
          <button class="btn small add-btn" type="button" data-id="${product.id}">Add to cart</button>
          <button class="view-btn" type="button" data-id="${product.id}">Quick view</button>
          <button class="wish-btn" type="button" aria-pressed="false" aria-label="Add to wishlist">&#9825;</button>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const query = state.query.toLowerCase();
  const list = sortProducts(
    products
      .filter(matchesCategory)
      .filter(product => product.name.toLowerCase().includes(query) || product.desc.toLowerCase().includes(query))
  );
  document.querySelector("#productGrid").innerHTML = list.map(productCard).join("");
  document.querySelector("#resultInfo").textContent = list.length + (list.length === 1 ? " product shown" : " products shown");
  document.querySelector("#emptyMsg").style.display = list.length === 0 ? "block" : "none";
}

function setCategory(cat) {
  state.cat = cat;
  document.querySelectorAll("#catList a").forEach(link => {
    link.classList.toggle("active-cat", link.dataset.cat === cat);
  });
  renderProducts();
}

function initProducts() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("cat");
  if (fromUrl && document.querySelector("#catList a[data-cat='" + fromUrl + "']")) state.cat = fromUrl;
  setCategory(state.cat);

  document.querySelector("#catList").addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    event.preventDefault();
    setCategory(link.dataset.cat);
    playSound("click");
  });

  document.querySelector("#search").addEventListener("input", event => {
    state.query = event.target.value.trim();
    renderProducts();
  });

  document.querySelector("#sort").addEventListener("change", event => {
    state.sort = event.target.value;
    renderProducts();
    playSound("click");
  });

  document.querySelector("#productGrid").addEventListener("click", event => {
    const button = event.target.closest(".add-btn");
    if (!button) return;
    state.cart += 1;
    updateCartBadge();
    playSound("add");
    button.textContent = "Added";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = "Add to cart";
      button.disabled = false;
    }, 900);
  });
}

function showImage(index) {
  const thumbs = Array.from(document.querySelectorAll(".thumb"));
  const image = document.querySelector("#displayImg");
  const caption = document.querySelector("#displayCaption");
  state.imageIndex = (index + thumbs.length) % thumbs.length;
  const thumb = thumbs[state.imageIndex];
  image.classList.add("swap");
  setTimeout(() => {
    image.src = thumb.dataset.src;
    image.alt = thumb.dataset.caption;
    caption.textContent = thumb.dataset.caption;
    image.classList.remove("swap");
  }, 200);
  thumbs.forEach((item, position) => item.classList.toggle("active", position === state.imageIndex));
  playSound("swap");
}

function initGallery() {
  document.querySelectorAll(".thumb").forEach((thumb, index) => {
    thumb.addEventListener("click", () => showImage(index));
  });
  document.querySelector("#nextImg").addEventListener("click", () => showImage(state.imageIndex + 1));
  document.querySelector("#prevImg").addEventListener("click", () => showImage(state.imageIndex - 1));
  document.addEventListener("keydown", event => {
    switch (event.key) {
      case "ArrowRight":
        if (!event.target.closest("#mainNav")) showImage(state.imageIndex + 1);
        break;
      case "ArrowLeft":
        if (!event.target.closest("#mainNav")) showImage(state.imageIndex - 1);
        break;
      default:
        break;
    }
  });
  document.querySelector(".thumb").classList.add("active");
}

function initContact() {
  const form = document.querySelector("#contactForm");
  const steps = document.querySelectorAll(".step");
  const stepLabel = document.querySelector("#stepLabel");
  const progressBar = document.querySelector("#progressBar");
  const backBtn = document.querySelector("#backBtn");
  const nextBtn = document.querySelector("#nextBtn");
  const submitBtn = document.querySelector("#submitBtn");
  const resetBtn = document.querySelector("#resetBtn");
  const formError = document.querySelector("#formError");
  const formResult = document.querySelector("#formResult");
  const summary = document.querySelector("#summary");
  const message = document.querySelector("#message");
  const charCount = document.querySelector("#charCount");

  function stepProblem(index) {
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const topic = form.elements.topic.value;
    const text = form.elements.message.value.trim();
    switch (index) {
      case 0:
        if (name.length < 2) return "Enter your name (at least 2 characters).";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address.";
        return "";
      case 1:
        if (!topic) return "Choose a topic.";
        if (text.length < 10) return "Message must be at least 10 characters.";
        return "";
      default:
        return "";
    }
  }

  function renderSummary() {
    summary.innerHTML = "";
    const rows = [
      ["Name", form.elements.name.value.trim()],
      ["Email", form.elements.email.value.trim()],
      ["Topic", form.elements.topic.value],
      ["Message", form.elements.message.value.trim()]
    ];
    rows.forEach(([label, value]) => {
      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label + ": ";
      paragraph.append(strong, document.createTextNode(value));
      summary.appendChild(paragraph);
    });
  }

  function showStep(index) {
    state.step = index;
    const last = steps.length - 1;
    steps.forEach((step, position) => step.classList.toggle("current", position === index));
    stepLabel.textContent = "Step " + (index + 1) + " of " + steps.length;
    progressBar.style.width = ((index + 1) / steps.length) * 100 + "%";
    backBtn.classList.toggle("hidden", index === 0);
    nextBtn.classList.toggle("hidden", index === last);
    submitBtn.classList.toggle("hidden", index !== last);
    if (index === last) renderSummary();
  }

  function goToStep(direction, callback) {
    formError.textContent = "";
    if (direction > 0) {
      const problem = stepProblem(state.step);
      if (problem) {
        formError.textContent = problem;
        playSound("error");
        return;
      }
    }
    callback(Math.min(Math.max(state.step + direction, 0), steps.length - 1));
    playSound("click");
  }

  function sendMessage(onSuccess, onFailure) {
    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      topic: form.elements.topic.value,
      message: form.elements.message.value.trim()
    };
    fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then(onSuccess)
      .catch(onFailure);
  }

  function resetForm() {
    form.querySelectorAll("input").forEach(input => {
      input.value = "";
    });
    form.querySelectorAll("select").forEach(select => {
      select.selectedIndex = 0;
    });
    message.value = "";
    charCount.textContent = 0;
    formError.textContent = "";
    formResult.textContent = "";
    showStep(0);
  }

  message.addEventListener("input", () => {
    charCount.textContent = message.value.length;
  });

  nextBtn.addEventListener("click", () => goToStep(1, showStep));
  backBtn.addEventListener("click", () => goToStep(-1, showStep));
  resetBtn.addEventListener("click", resetForm);

  form.addEventListener("submit", event => {
    event.preventDefault();
    submitBtn.disabled = true;
    const name = form.elements.name.value.trim();
    sendMessage(
      () => {
        resetForm();
        formResult.textContent = "Thank you, " + name + "! Your message has been received.";
        retrigger(formResult, "pop");
        submitBtn.disabled = false;
        playSound("success");
      },
      () => {
        formError.textContent = "Could not send the message. Check your connection and try again.";
        submitBtn.disabled = false;
        playSound("error");
      }
    );
  });

  showStep(0);
}

function formatDateTime(date) {
  const day = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return day + ", " + time;
}

function updateDateTime() {
  document.querySelector("#dateTime").textContent = formatDateTime(new Date());
}

function changeBackground() {
  const mode = document.body.classList.contains("night") ? "night" : "day";
  state.colorIndex = (state.colorIndex + 1) % palettes[mode].length;
  document.body.style.backgroundColor = palettes[mode][state.colorIndex];
  playSound("click");
}

function toggleAnswer(button) {
  const answer = button.nextElementSibling;
  const isOpen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isOpen));
  answer.style.maxHeight = isOpen ? "0px" : answer.scrollHeight + "px";
  playSound("click");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function initHomeExtras() {
  const popup = document.querySelector("#subPopup");
  const subForm = document.querySelector("#subForm");
  const subEmail = document.querySelector("#subEmail");
  const subError = document.querySelector("#subError");
  const subSuccess = document.querySelector("#subSuccess");
  const openButton = document.querySelector("#openSub");

  function openPopup() {
    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
    subEmail.focus();
  }

  function closePopup() {
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
    openButton.focus();
  }

  updateDateTime();
  setInterval(updateDateTime, 1000);

  document.querySelector("#colorBtn").addEventListener("click", changeBackground);

  document.querySelectorAll(".faq-q").forEach(button => {
    button.addEventListener("click", () => toggleAnswer(button));
  });

  openButton.addEventListener("click", openPopup);
  document.querySelector("#closeSub").addEventListener("click", closePopup);
  popup.addEventListener("click", event => {
    if (event.target === popup) closePopup();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && popup.classList.contains("open")) closePopup();
  });

  subForm.addEventListener("submit", event => {
    event.preventDefault();
    subSuccess.textContent = "";
    if (!subEmail.value.trim()) {
      subError.textContent = "Enter your email address.";
      playSound("error");
      return;
    }
    if (!isValidEmail(subEmail.value)) {
      subError.textContent = "Enter a valid email, for example name@example.com.";
      playSound("error");
      return;
    }
    subError.textContent = "";
    subSuccess.textContent = "Thank you for subscribing!";
    subForm.reset();
    playSound("success");
  });
}

function initSignup() {
  const form = document.querySelector("#signupForm");
  const success = document.querySelector("#signupSuccess");

  const rules = {
    fullName(value) {
      if (!value.trim()) return "Enter your full name.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      return "";
    },
    signupEmail(value) {
      if (!value.trim()) return "Enter your email address.";
      if (!isValidEmail(value)) return "Enter a valid email, for example name@example.com.";
      return "";
    },
    password(value) {
      if (!value) return "Create a password.";
      if (value.length < 8) return "Password must be at least 8 characters.";
      if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Password must include a letter and a number.";
      return "";
    },
    confirmPassword(value) {
      if (!value) return "Confirm your password.";
      if (value !== form.elements.password.value) return "Passwords do not match.";
      return "";
    },
    terms() {
      return form.elements.terms.checked ? "" : "You must agree to the terms to continue.";
    }
  };

  function validateField(name) {
    const field = form.elements[name];
    const message = rules[name](field.value);
    document.querySelector("#" + name + "Error").textContent = message;
    if (field.type !== "checkbox") {
      field.classList.toggle("invalid", Boolean(message));
      field.classList.toggle("valid", !message);
    }
    return !message;
  }

  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    field.addEventListener(field.type === "checkbox" ? "change" : "blur", () => validateField(name));
    field.addEventListener("input", () => {
      if (field.classList.contains("invalid")) validateField(name);
      if (name === "password" && form.elements.confirmPassword.value) validateField("confirmPassword");
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    success.textContent = "";
    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (allValid) {
      success.textContent = "Account created. Welcome to TechWorld, " + form.elements.fullName.value.trim() + "!";
      form.reset();
      form.querySelectorAll("input").forEach(input => input.classList.remove("valid"));
      playSound("success");
    } else {
      playSound("error");
      (form.querySelector(".invalid") || form.elements.terms).focus();
    }
  });
}

initCommon();
if (document.querySelector("#nameForm")) initHome();
if (document.querySelector("#productGrid")) initProducts();
if (document.querySelector("#thumbs")) initGallery();
if (document.querySelector("#contactForm")) initContact();
if (document.querySelector("#signupForm")) initSignup();
