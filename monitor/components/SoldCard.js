class SoldCard extends HTMLElement {
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
    if(this.item.highestBidder !== null) {
        this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./styles.css">


        <div class="card">
        <h3>The winner of ${this.item.name} is ${this.item.highestBidderName} for </h3>
        <p><strong>$${this.item.highestBid}</strong></p>
        <p>Base price: ${this.item.basePrice}</p>

        </div>
        `;
    } else {
        this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./styles.css">


        <div class="card">
        <h3>${this.item.name} was not sold</h3>
        <p><strong>$${this.item.basePrice}</strong></p>
        </div>
        `; 
    }
  }
}

customElements.define("sold-card", SoldCard);
