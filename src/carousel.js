export class Carousel {
    constructor(containerId, cardsData) {
        this.container = document.getElementById(containerId);
        this.data = cardsData;
        this.cards = [];
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.currentIndex = 0;

        this.init();
    }

    init() {
        this.render();
        this.updateStack();
        this.addEventListeners();
    }

    render() {
        this.container.innerHTML = '';
        this.cards = this.data.map((item, index) => {
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.innerHTML = `
        <div class="card-inner" style="background-image: url('${item.image}')">
          <div class="card-overlay">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </div>
        </div>
      `;
            this.container.appendChild(card);
            return card;
        });
    }

    updateStack() {
        this.cards.forEach((card, index) => {
            // Relative index from the top card
            const relIndex = (index - this.currentIndex + this.cards.length) % this.cards.length;

            card.classList.remove('card-1', 'card-2', 'card-3', 'card-hidden');

            if (relIndex === 0) {
                card.classList.add('card-1');
                card.style.pointerEvents = 'auto';
            } else if (relIndex === 1) {
                card.classList.add('card-2');
                card.style.pointerEvents = 'none';
            } else if (relIndex === 2) {
                card.classList.add('card-3');
                card.style.pointerEvents = 'none';
            } else {
                card.classList.add('card-hidden');
                card.style.pointerEvents = 'none';
            }
        });
    }

    addEventListeners() {
        const topCardContainer = this.container;

        topCardContainer.addEventListener('pointerdown', (e) => this.onDragStart(e));
        window.addEventListener('pointermove', (e) => this.onDragMove(e));
        window.addEventListener('pointerup', () => this.onDragEnd());
    }

    onDragStart(e) {
        if (this.cards[this.currentIndex]) {
            this.isDragging = true;
            this.startX = e.clientX;
            this.cards[this.currentIndex].style.transition = 'none';
        }
    }

    onDragMove(e) {
        if (!this.isDragging) return;

        this.currentX = e.clientX - this.startX;
        const rotate = this.currentX / 15;
        const currentCard = this.cards[this.currentIndex];

        currentCard.style.transform = `translateX(${this.currentX}px) rotate(${rotate}deg)`;
    }

    onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;

        const currentCard = this.cards[this.currentIndex];
        currentCard.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease';

        if (Math.abs(this.currentX) > 100) {
            // Fly off
            const flyX = this.currentX > 0 ? 1000 : -1000;
            currentCard.style.transform = `translateX(${flyX}px) rotate(${flyX / 20}deg)`;
            currentCard.style.opacity = '0';

            setTimeout(() => {
                // Reset old card and move to next
                currentCard.style.transform = '';
                currentCard.style.opacity = '';
                this.currentIndex = (this.currentIndex + 1) % this.cards.length;
                this.updateStack();
            }, 500);
        } else {
            // Snap back
            currentCard.style.transform = '';
        }

        this.currentX = 0;
    }
}
