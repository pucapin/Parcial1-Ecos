class ItemCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.item = JSON.parse(this.getAttribute("item"));      
    this.render();
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./styles.css">


        <div class="card">
        <h3>${this.item.name}</h3>
        <p>Current Bid: <strong>$${this.item.highestBid}</strong></p>
        <p id="highest-bidder">Highest Bidder: ${this.item.highestBidderName}</p>
        </div>
        `;
        if(this.item.highestBidder === null) {
          const highestBidder = this.shadowRoot.getElementById("highest-bidder");
          highestBidder.textContent = "Highest Bidder: None yet";
        }
        const card = this.shadowRoot.querySelector(".card");
        card.addEventListener("click", () => {
          window.location.href = `/player/item.html?id=${this.item.id}`;
        });
  }
}

customElements.define("item-card", ItemCard);
