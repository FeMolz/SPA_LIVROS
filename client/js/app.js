const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/books'
    : '/books';

const AUTH_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/user'
    : '/api/user';

function getToken() {
    return localStorage.getItem('auth-token');
}

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'auth-token': token
    };
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();

    document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);

    // Auth Event Listeners
    document.getElementById('userLoginForm').addEventListener('submit', handleLogin);
    document.getElementById('userRegisterForm').addEventListener('submit', handleRegisterUser);
    document.getElementById('forgotForm').addEventListener('submit', handleForgotPassword);
    document.getElementById('resetForm').addEventListener('submit', handleResetPassword);

    const addYearForm = document.getElementById('addYearForm');
    if (addYearForm) addYearForm.addEventListener('submit', handleAddYearSubmit);

    // Edit Year Listener
    const editYearForm = document.getElementById('editYearForm');
    if (editYearForm) {
        editYearForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalYear = document.getElementById('originalYear').value;
            const newYear = document.getElementById('editYearInput').value;

            if (!newYear || isNaN(newYear)) return;

            console.log("Submitting Edit Year:", { originalYear, newYear });

            try {
                const response = await fetch(`${API_URL}/year/${originalYear}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ newYear: Number(newYear) })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Logic to handle success
                    if (window.customAddedYears && window.customAddedYears.has(originalYear)) {
                        window.customAddedYears.delete(originalYear);
                        window.customAddedYears.add(newYear);
                    }

                    closeModal('editYearModal');
                    await fetchBooks();

                    if (data.result && data.result.modifiedCount > 0) {
                        alert(`Success! Updated ${data.result.modifiedCount} books to year ${newYear}.`);
                    } else if (window.customAddedYears.has(newYear)) {
                        alert(`Success! Renamed empty year to ${newYear}.`);
                    } else {
                        alert('Year updated (No books were moved).');
                    }

                } else {
                    const err = await response.json();
                    alert('Error: ' + err.mensagem);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to update year');
            }
        });
    }
});

function checkAuth() {
    const token = getToken();
    const authSection = document.getElementById('authSection');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('main');

    if (!token) {
        authSection.style.display = 'flex';
        sidebar.style.display = 'none';
        main.style.display = 'none';
    } else {
        authSection.style.display = 'none';
        sidebar.style.display = 'flex';
        main.style.display = 'block';
        fetchBooks();
    }
}

// Auth Functions
window.switchAuthTab = (tab) => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('userLoginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('userRegisterForm').classList.add('active');
    }
};

let allBooks = []; // Store books locally to easier filtering without refetching constantly

async function fetchBooks() {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_URL}`, {
            headers: { 'auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch books');
        allBooks = await response.json();
        renderAllYears(allBooks);
        renderFavorites(allBooks);
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.itens-sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {

            const link = item.querySelector('a');
            if (e.target.tagName !== 'A') {

            } else {
                e.preventDefault();
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active-section'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }

    if (sectionId === 'favorites') {
        renderFavorites(allBooks);
    } else if (sectionId === 'genres') {
        renderGenresView(allBooks);
    }
}

let currentGenreFilters = new Set(); // Changed from string 'All' to Set
let collapsedYears = new Set(); // Track collapsed years

function renderGenresView(books) {
    const filtersContainer = document.getElementById('genreFilters');
    const containerForDropdown = filtersContainer; // Reusing the same container

    const genres = new Set();
    books.forEach(book => {
        if (Array.isArray(book.genero)) {
            book.genero.forEach(g => genres.add(g));
        } else if (book.genero) {
            genres.add(book.genero);
        }
    });

    // Sort genres alphabetically
    const sortedGenres = Array.from(genres).sort();

    // Create Custom Dropdown HTML
    // Check if dropdown already exists to avoid re-creating it when re-rendering view
    if (!document.getElementById('customGenreDropdown')) {
        const dropdownHTML = `
            <div class="dropdown-container" id="customGenreDropdown">
                <div class="dropdown-header" onclick="toggleDropdown()">
                    <span id="dropdownSelectedText">Select Categories</span>
                    <i class="bi bi-chevron-down"></i>
                </div>
                <div class="dropdown-list" id="dropdownList">
                    ${sortedGenres.map(genre => `
                        <label class="dropdown-item">
                            <input type="checkbox" value="${genre}" onchange="handleGenreChange(this)">
                            ${genre}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        containerForDropdown.innerHTML = dropdownHTML;

        // Close dropdown when clicking outside - Only add listener ONCE when creating
        document.addEventListener('click', function (e) {
            const dropdown = document.getElementById('customGenreDropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                const list = document.getElementById('dropdownList');
                if (list) list.classList.remove('show');
            }
        });
    }

    // Initial Filter Run (in case returning to view)
    filterGenres();
}

window.toggleDropdown = () => {
    const list = document.getElementById('dropdownList');
    list.classList.toggle('show');
}

window.handleGenreChange = (checkbox) => {
    if (checkbox.checked) {
        currentGenreFilters.add(checkbox.value);
    } else {
        currentGenreFilters.delete(checkbox.value);
    }
    updateDropdownHeader();
    filterGenres();
}

function updateDropdownHeader() {
    const textSpan = document.getElementById('dropdownSelectedText');
    if (currentGenreFilters.size === 0) {
        textSpan.innerText = "Select Categories";
    } else {
        textSpan.innerText = `${currentGenreFilters.size} Selected`;
    }
}


function filterGenres() {
    const listContainer = document.getElementById('genresList');

    let filteredBooks = allBooks;

    if (currentGenreFilters.size > 0) {
        filteredBooks = allBooks.filter(book => {
            const bookGenres = Array.isArray(book.genero) ? book.genero : [book.genero];
            return bookGenres.some(g => currentGenreFilters.has(g));
        });
    }

    listContainer.innerHTML = '';
    if (filteredBooks.length === 0) {
        listContainer.innerHTML = '<p class="no-books-msg">No books found for these genres.</p>';
        return;
    }

    filteredBooks.forEach(book => {
        listContainer.appendChild(createBookCard(book));
    });
}

function renderAllYears(books) {
    const container = document.getElementById('allYears');
    // Rebuilding Header with Add Year Button
    container.innerHTML = `
        <div class="main-header">
            <h2 class="section-title">My Reading Journey</h2>
            <button class="btn-add-year" onclick="openAddYearModal()" title="Add a new year">
                <i class="bi bi-plus-lg"></i> Add Year
            </button>
        </div>
    `;

    const booksByYear = books.reduce((acc, book) => {
        const year = book.anoLeitura || 'Unknown';
        if (!acc[year]) acc[year] = [];
        acc[year].push(book);
        return acc;
    }, {});

    // Sort books by 'order' if it exists
    Object.keys(booksByYear).forEach(year => {
        booksByYear[year].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    // Include manually added empty years if they exist in a temp cache or just use the current logic (User said "should make it possible to register books IN that new year")
    // If I add a year via UI, I need it to appear even if empty.
    // I will use a global set for custom Added years if they don't have books yet.
    if (!window.customAddedYears) window.customAddedYears = new Set();

    window.customAddedYears.forEach(y => {
        if (!booksByYear[y]) booksByYear[y] = [];
    });

    const sortedYears = Object.keys(booksByYear).sort((a, b) => b - a);

    // Ensure current year is always there?
    const currentYear = new Date().getFullYear();
    if (!sortedYears.includes(String(currentYear))) {
        sortedYears.unshift(String(currentYear));
        booksByYear[currentYear] = [];
    }

    if (window.customAddedYears.size > 0) {
        // Re-sort if we added custom years
        sortedYears.sort((a, b) => b - a);
    }
    // Remove duplicates if any logic created them
    const uniqueYears = [...new Set(sortedYears)];

    uniqueYears.forEach(year => {
        const yearSection = document.createElement('div');
        yearSection.classList.add('year-section');
        yearSection.setAttribute('data-year', year);
        if (collapsedYears.has(String(year))) {
            yearSection.classList.add('collapsed');
        }

        const bookCount = booksByYear[year].length;
        const isCollapsed = collapsedYears.has(String(year));

        const yearHeader = document.createElement('div');
        yearHeader.classList.add('year-header');
        yearHeader.innerHTML = `
            <h3>${year} <span style="font-size: 0.8em; opacity: 0.6; margin-left: 10px;">(${bookCount} books)</span></h3>
            <div class="year-header-actions">
                <button class="add-book-btn" onclick="openRegisterModal(${year})">
                    <i class="bi bi-plus-lg"></i> Add
                </button>
                <div class="year-actions-group">
                    <button class="btn-icon-action" onclick="openEditYearModal('${year}')" title="Edit Year">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon-action delete" onclick="deleteYear('${year}')" title="Delete Year">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                 <button class="btn-minimize ${isCollapsed ? 'collapsed' : ''}" onclick="toggleYearCollapse('${year}', this)">
                    <i class="bi bi-chevron-up"></i>
                </button>
            </div>
        `;

        const booksGrid = document.createElement('div');
        booksGrid.classList.add('books-grid');

        if (bookCount === 0) {
            booksGrid.innerHTML = '<p class="no-books-msg">No books registered this year yet.</p>';
        } else {
            booksByYear[year].forEach(book => {
                const card = createBookCard(book);
                // DnD attributes removed
                booksGrid.appendChild(card);
            });
        }

        yearSection.appendChild(yearHeader);
        yearSection.appendChild(booksGrid);
        container.appendChild(yearSection);
    });
}

window.toggleYearCollapse = (year, btn) => {
    // Toggle state
    if (collapsedYears.has(year)) {
        collapsedYears.delete(year);
    } else {
        collapsedYears.add(year);
    }
    // Re-render is safer to ensure consistency, but simple class toggle is faster.
    // However, re-rendering preserves the "State" correctly if we have dynamic updates.
    // For smoothness, let's just toggle classes closest to the button.
    const section = btn.closest('.year-section');
    section.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');
};

window.openAddYearModal = () => {
    document.getElementById('addYearForm').reset();
    document.getElementById('addYearModal').style.display = 'block';
};

window.handleAddYearSubmit = (e) => {
    e.preventDefault();
    const yearInput = document.getElementById('newYearInput').value;

    if (yearInput && !isNaN(yearInput) && yearInput.length === 4) {
        if (!window.customAddedYears) window.customAddedYears = new Set();
        window.customAddedYears.add(yearInput);

        closeModal('addYearModal');
        // Refresh view
        renderAllYears(allBooks);
    } else {
        alert("Please enter a valid 4-digit year.");
    }
};

window.openEditYearModal = (year) => {
    document.getElementById('editYearForm').reset();
    document.getElementById('originalYear').value = year;
    document.getElementById('editYearInput').value = year;
    document.getElementById('editYearModal').style.display = 'block';
};

// --- Confirmation Modal Logic ---
let pendingConfirmationCallback = null;

function openConfirmationModal(message, callback) {
    document.getElementById('confirmationMessage').innerText = message;
    pendingConfirmationCallback = callback;
    document.getElementById('confirmationModal').style.display = 'block';
}

document.getElementById('confirmBtn').addEventListener('click', async () => {
    if (pendingConfirmationCallback) {
        await pendingConfirmationCallback();
        pendingConfirmationCallback = null;
    }
    closeModal('confirmationModal');
});

window.deleteYear = (year) => {
    openConfirmationModal(
        `Are you sure you want to delete the year ${year}? ALL books in this year will be deleted!`,
        async () => {
            try {
                const response = await fetch(`${API_URL}/year/${year}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    alert(`Year ${year} deleted.`);
                    if (window.customAddedYears) window.customAddedYears.delete(String(year));
                    fetchBooks();
                } else {
                    const err = await response.json();
                    alert('Error: ' + err.mensagem);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to delete year');
            }
        }
    );
};


function renderFavorites(books) {
    const container = document.getElementById('favoritesList');
    const favoriteBooks = books.filter(book => book.isFavorite);

    container.innerHTML = '';

    if (favoriteBooks.length === 0) {
        container.innerHTML = '<p class="no-books-msg">You haven\'t added any favorites yet.</p>';
        return;
    }

    favoriteBooks.forEach(book => {
        container.appendChild(createBookCard(book));
    });
}

function createBookCard(book) {
    const bookCard = document.createElement('div');
    bookCard.classList.add('book-card');

    const heartIcon = document.createElement('div');
    heartIcon.classList.add('favorite-btn');
    if (book.isFavorite) heartIcon.classList.add('active');
    heartIcon.innerHTML = book.isFavorite ? '<i class="bi bi-heart-fill"></i>' : '<i class="bi bi-heart"></i>';
    heartIcon.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(book, heartIcon);
    };

    bookCard.onclick = () => openDetailsModal(book);

    const coverImg = book.capaUrl ? `<img src="${book.capaUrl}" alt="${book.titulo}">` : '<div class="no-cover"><i class="bi bi-book"></i><br>No Cover</div>';

    bookCard.innerHTML = `
        <div class="card-cover">
            ${coverImg}
            <div class="card-overlay">
                <span class="rating-badge"><i class="bi bi-star-fill"></i> ${book.nota || '-'}</span>
            </div>
        </div>
        <div class="book-info">
            <h4>${book.titulo}</h4>
            <p>${book.autor.join(', ')}</p>
            <div class="status-dot ${book.status.toLowerCase().replace(' ', '-')}"></div>
        </div>
    `;
    bookCard.appendChild(heartIcon);
    return bookCard;
}

async function toggleFavorite(book, iconElement) {
    const newStatus = !book.isFavorite;

    book.isFavorite = newStatus;
    iconElement.classList.toggle('active');
    iconElement.innerHTML = newStatus ? '<i class="bi bi-heart-fill"></i>' : '<i class="bi bi-heart"></i>';

    try {
        const response = await fetch(`${API_URL}/${book._id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isFavorite: newStatus })
        });

        if (!response.ok) {
            book.isFavorite = !newStatus;
            iconElement.classList.toggle('active');
            iconElement.innerHTML = !newStatus ? '<i class="bi bi-heart-fill"></i>' : '<i class="bi bi-heart"></i>';
            alert('Failed to update favorite');
        }
    } catch (error) {
        console.error('Error updating favorite:', error);
    }
}

// Modal Functions
window.openRegisterModal = (year) => {
    document.getElementById('registerForm').reset();
    document.getElementById('modalAction').innerText = 'Register';
    document.getElementById('modalYear').innerText = year;
    document.getElementById('bookYear').value = year;
    document.getElementById('bookId').value = '';
    document.getElementById('registerModal').style.display = 'block';
};

window.openEditModal = (book) => {
    closeModal('detailsModal');
    document.getElementById('modalAction').innerText = 'Edit';

    const year = book.anoLeitura || new Date().getFullYear();
    document.getElementById('modalYear').innerText = year;
    document.getElementById('bookYear').value = year;
    document.getElementById('bookId').value = book._id;

    document.getElementById('titulo').value = book.titulo;
    document.getElementById('autor').value = Array.isArray(book.autor) ? book.autor.join(', ') : book.autor;
    document.getElementById('editora').value = book.editora || '';
    document.getElementById('anoPublicacao').value = book.anoPublicacao || '';
    document.getElementById('genero').value = Array.isArray(book.genero) ? book.genero.join(', ') : book.genero;
    document.getElementById('numeroPaginas').value = book.numeroPaginas || '';
    document.getElementById('nota').value = book.nota || '';
    document.getElementById('capaUrl').value = book.capaUrl || '';
    document.getElementById('sinopse').value = book.sinopse || '';
    document.getElementById('status').value = book.status;

    document.getElementById('registerModal').style.display = 'block';
};

window.openDetailsModal = (book) => {
    const detailsContainer = document.getElementById('bookDetails');
    const coverImg = book.capaUrl ? `<img src="${book.capaUrl}" alt="${book.titulo}" class="detail-cover">` : '<div class="no-cover-detail"><i class="bi bi-book"></i></div>';

    detailsContainer.innerHTML = `
        <div class="detail-layout">
            <div class="detail-image">
                ${coverImg}
            </div>
            <div class="detail-info">
                <h3>${book.titulo}</h3>
                <p><strong>Author:</strong> ${Array.isArray(book.autor) ? book.autor.join(', ') : book.autor}</p>
                <div class="detail-meta">
                    <p><strong>Publisher:</strong> ${book.editora || '-'}</p>
                    <p><strong>Year:</strong> ${book.anoPublicacao || '-'}</p>
                    <p><strong>Pages:</strong> ${book.numeroPaginas || '-'}</p>
                </div>
                <p><strong>Genres:</strong> ${Array.isArray(book.genero) ? book.genero.join(', ') : book.genero}</p>
                <div class="rating-display">
                    <strong>Rating:</strong> <span class="stars">${renderStars(book.nota)}</span> (${book.nota}/10)
                </div>
                <div class="status-badge ${book.status.toLowerCase().replace(' ', '-')}">${book.status}</div>
                
                <div class="synopsis">
                    <h4>Synopsis</h4>
                    <p>${book.sinopse || 'No synopsis available.'}</p>
                </div>

                <div class="action-buttons">
                    <button class="btn-edit" id="btnEdit"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn-delete" id="btnDelete"><i class="bi bi-trash"></i> Delete</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('detailsModal').style.display = 'block';

    document.getElementById('btnEdit').onclick = () => openEditModal(book);
    document.getElementById('btnDelete').onclick = () => deleteBook(book._id);
};

function renderStars(rating) {
    if (!rating) return '';
    const stars = Math.round(rating / 2);
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += i < stars ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
    }
    return html;
}

window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
};

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookId = formData.get('bookId');

    const bookData = {
        titulo: formData.get('titulo'),
        autor: formData.get('autor').split(',').map(s => s.trim()),
        editora: formData.get('editora'),
        anoPublicacao: formData.get('anoPublicacao'),
        genero: formData.get('genero').split(',').map(s => s.trim()),
        numeroPaginas: formData.get('numeroPaginas'),
        nota: formData.get('nota'),
        capaUrl: formData.get('capaUrl'),
        sinopse: formData.get('sinopse'),
        status: formData.get('status'),
        anoLeitura: formData.get('anoLeitura')
    };

    try {
        let response;
        if (bookId) {
            response = await fetch(`${API_URL}/${bookId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(bookData)
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(bookData)
            });
        }

        if (response.ok) {
            closeModal('registerModal');
            e.target.reset();
            fetchBooks();
        } else {
            const err = await response.json();
            alert('Error: ' + err.mensagem);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting form');
    }
}

async function deleteBook(id) {
    openConfirmationModal(
        'Are you sure you want to delete this book?',
        async () => {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: { 'auth-token': getToken() }
                });

                if (response.ok) {
                    closeModal('detailsModal');
                    fetchBooks();
                } else {
                    alert('Error deleting book');
                }
            } catch (error) {
                console.error('Error deleting book:', error);
            }
        }
    );
}
// Auth Functions
window.switchAuthTab = (tab) => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector('.auth-tabs').style.display = 'flex';

    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('userLoginForm').classList.add('active');
    } else if (tab === 'register') {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('userRegisterForm').classList.add('active');
    } else if (tab === 'forgot') {
        document.querySelector('.auth-tabs').style.display = 'none';
        document.getElementById('forgotForm').classList.add('active');
    } else if (tab === 'reset') {
        document.querySelector('.auth-tabs').style.display = 'none';
        document.getElementById('resetForm').classList.add('active');
    }
};

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const token = await response.text();
            localStorage.setItem('auth-token', token);
            checkAuth();
        } else {
            const err = await response.text();
            alert('Login failed: ' + err);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error');
    }
}

async function handleRegisterUser(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            switchAuthTab('login');
        } else {
            const err = await response.text();
            alert('Registration failed: ' + err);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration error');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;

    try {
        const response = await fetch(`${AUTH_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            alert('Code sent to your email!');
            document.getElementById('resetEmail').value = email;
            switchAuthTab('reset');
        } else {
            const err = await response.text();
            alert('Error: ' + err);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send code');
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch(`${AUTH_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPassword })
        });

        if (response.ok) {
            alert('Password updated successfully! Please login.');
            switchAuthTab('login');
        } else {
            const err = await response.text();
            alert('Error: ' + err);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to reset password');
    }
}

window.logout = () => {
    localStorage.removeItem('auth-token');
    checkAuth();
};
