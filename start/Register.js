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
        `;
    const registerBtn = this.shadowRoot.getElementById('register');
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const username = this.shadowRoot.getElementById("input-user").value;

      fetch("/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "name": username })
      })
        .then(res => {
          if (!res.ok) throw new Error("Registration failed");
          return res.json();
        })
        .then(data => {
          console.log("Registration success:", data);
          window.location.href = "/player";
          localStorage.setItem("user", JSON.stringify(data.id));
        })
        .catch(err => {
          console.error(err);
        });
    });
  }
}

customElements.define("register-page", Register);
