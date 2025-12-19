const API_URL = 'http://localhost:3000/books';

document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    setupNavigation();

    document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);
});

let allBooks = []; // Store books locally to easier filtering without refetching constantly

async function fetchBooks() {
    try {
        const response = await fetch(API_URL);
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

let currentGenreFilter = 'All';

function renderGenresView(books) {
    const listContainer = document.getElementById('genresList');
    const filtersContainer = document.getElementById('genreFilters');

    const genres = new Set();
    books.forEach(book => {
        if (Array.isArray(book.genero)) {
            book.genero.forEach(g => genres.add(g));
        } else if (book.genero) {
            genres.add(book.genero);
        }
    });

    filtersContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.classList.add('genre-btn');
    if (currentGenreFilter === 'All') allBtn.classList.add('active');
    allBtn.innerText = 'All';
    allBtn.onclick = () => filterGenres('All');
    filtersContainer.appendChild(allBtn);

    Array.from(genres).sort().forEach(genre => {
        const btn = document.createElement('button');
        btn.classList.add('genre-btn');
        if (currentGenreFilter === genre) btn.classList.add('active');
        btn.innerText = genre;
        btn.onclick = () => filterGenres(genre);
        filtersContainer.appendChild(btn);
    });

    filterGenres(currentGenreFilter, false);
}

function filterGenres(genre, updateFilters = true) {
    currentGenreFilter = genre;
    const listContainer = document.getElementById('genresList');

    if (updateFilters) {
        const buttons = document.querySelectorAll('.genre-btn');
        buttons.forEach(btn => {
            if (btn.innerText === genre) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    let filteredBooks = allBooks;
    if (genre !== 'All') {
        filteredBooks = allBooks.filter(book => {
            if (Array.isArray(book.genero)) {
                return book.genero.includes(genre);
            }
            return book.genero === genre;
        });
    }

    listContainer.innerHTML = '';
    if (filteredBooks.length === 0) {
        listContainer.innerHTML = '<p class="no-books-msg">No books found for this genre.</p>';
        return;
    }

    filteredBooks.forEach(book => {
        listContainer.appendChild(createBookCard(book));
    });
}

function renderAllYears(books) {
    const container = document.getElementById('allYears');
    container.innerHTML = '<h2 class="section-title">My Reading Journey</h2>';

    const booksByYear = books.reduce((acc, book) => {
        const year = book.anoLeitura || 'Unknown';
        if (!acc[year]) acc[year] = [];
        acc[year].push(book);
        return acc;
    }, {});

    const sortedYears = Object.keys(booksByYear).sort((a, b) => b - a);

    const currentYear = new Date().getFullYear();
    if (!sortedYears.includes(String(currentYear))) {
        sortedYears.unshift(String(currentYear));
        booksByYear[currentYear] = [];
    }

    sortedYears.forEach(year => {
        const yearSection = document.createElement('div');
        yearSection.classList.add('year-section');

        const yearHeader = document.createElement('div');
        yearHeader.classList.add('year-header');
        yearHeader.innerHTML = `
            <h3>${year}</h3>
            <button class="add-book-btn" onclick="openRegisterModal(${year})">
                <i class="bi bi-plus-lg"></i> Add Book
            </button>
        `;

        const booksGrid = document.createElement('div');
        booksGrid.classList.add('books-grid');

        if (booksByYear[year].length === 0) {
            booksGrid.innerHTML = '<p class="no-books-msg">No books registered this year yet.</p>';
        } else {
            booksByYear[year].forEach(book => {
                booksGrid.appendChild(createBookCard(book));
            });
        }

        yearSection.appendChild(yearHeader);
        yearSection.appendChild(booksGrid);
        container.appendChild(yearSection);
    });
}

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
            headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
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
