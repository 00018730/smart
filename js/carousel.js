document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.getElementById('teacherCarousel');
    const cards = document.querySelectorAll('.teacher-card');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentIndex = 0;

    function updateCarousel() {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev-card', 'next-card', 'hidden');
            
            if (index === currentIndex) {
                card.classList.add('active');
            } else if (index === (currentIndex - 1 + cards.length) % cards.length) {
                card.classList.add('prev-card');
            } else if (index === (currentIndex + 1) % cards.length) {
                card.classList.add('next-card');
            } else {
                card.classList.add('hidden'); // Hide cards that are far away
            }
        });
    }

    // CLICK TO SWITCH: Allows user to click the side cards to bring them forward
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index !== currentIndex) {
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    // SWIPE LOGIC (Mouse & Touch)
    let startX = 0;
    carousel.addEventListener('mousedown', (e) => startX = e.pageX);
    carousel.addEventListener('mouseup', (e) => {
        let endX = e.pageX;
        if (startX - endX > 50) nextBtn.click(); // Swipe Left
        if (startX - endX < -50) prevBtn.click(); // Swipe Right
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents click from bubbling to cards
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        updateCarousel();
    });

    updateCarousel();
});