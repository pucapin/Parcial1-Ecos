class Register extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./styles.css">


        <input type="text" placeholder="Enter username" required id="input-user"/>
        <button id="register">Start</button>
                <p id="error-message"></p>

        `;
    const registerBtn = this.shadowRoot.getElementById('register');
    const errorEl = this.shadowRoot.getElementById('error-message');
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const username = this.shadowRoot.getElementById("input-user").value;

      fetch("/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username })
      })
      .then(async res => {
        if (!res.ok) {
          const errorMessage = await res.text();
          errorEl.textContent = errorMessage || "Registration failed";
          throw new Error(errorMessage || "Registration failed");
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem("user", data.id);
        window.location.href = "/player";
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        btn.disabled = false;
      });
    });
    };
  }

customElements.define("register-page", Register);
