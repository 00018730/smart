document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('selectionGrid');
    const params = new URLSearchParams(window.location.search);
    const book = params.get('book');
    const type = params.get('type') || 'listening';

    if (book) {
        renderTests(book, type);
    } else {
        setupBookListeners(type);
    }

    function setupBookListeners(skillType) {
        const cards = document.querySelectorAll('.practice-card');
        cards.forEach(card => {
            const bookNum = card.dataset.book;
            card.onclick = () => {
                window.location.href = `practice-selection.html?type=${skillType}&book=${bookNum}`;
            };
        });
    }

    function renderTests(bookNum, skillType) {
    document.getElementById('selectionTitle').innerText = `Cambridge ${bookNum}`;
    grid.innerHTML = ""; 
    document.getElementById('backBtn').classList.remove('hidden');

    const icons = { listening: '🎧', reading: '📖', writing: '✍️', speaking: '🗣️' };

    for (let i = 1; i <= 4; i++) {
        const card = document.createElement('div');
        card.className = 'practice-card';
        card.innerHTML = `
            <div class="card-icon">${icons[skillType] || '📝'}</div>
            <h3>Test ${i}</h3>
            <p>Start Practice</p>
        `;
        card.onclick = () => {
            // This is the key change: opening listening-test.html
            const testId = `cam${bookNum}test${i}`;
            window.location.href = `listening-practice.html?test=${testId}`;
        };
        grid.appendChild(card);
    }
}
});

function goBack() {
    const params = new URLSearchParams(window.location.search);
    window.location.href = `practice-selection.html?type=${params.get('type')}`;
}