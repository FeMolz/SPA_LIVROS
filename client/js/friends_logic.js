
// --- Friends Logic ---

async function loadFriendsView() {
    await fetchFriendRequests();
    await fetchFriends();
}

async function searchUsers() {
    const query = document.getElementById('userSearchInput').value;
    if (!query) return;

    try {
        const response = await fetch(`${FRIENDS_URL}/search?q=${query}`, {
            headers: getAuthHeaders()
        });
        const users = await response.json();
        renderSearchResults(users);
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

function renderSearchResults(users) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.9rem;">No users found.</p>';
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.classList.add('user-card');
        card.innerHTML = `
            <div class="card-info">
                <h5>${user.name}</h5>
                <span>${user.email}</span>
            </div>
            <button class="btn-small" onclick="sendFriendRequest('${user._id}')">Add</button>
        `;
        container.appendChild(card);
    });
}

async function sendFriendRequest(userId) {
    try {
        const response = await fetch(`${FRIENDS_URL}/request`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ receiverId: userId })
        });

        if (response.ok) {
            alert('Request sent!');
            document.getElementById('userSearchInput').value = '';
            document.getElementById('searchResults').innerHTML = '';
        } else {
            const err = await response.text();
            alert('Error: ' + err);
        }
    } catch (error) {
        console.error('Error sending request:', error);
    }
}

async function fetchFriendRequests() {
    try {
        const response = await fetch(`${FRIENDS_URL}/requests`, {
            headers: getAuthHeaders()
        });
        const requests = await response.json();
        renderRequests(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
    }
}

function renderRequests(requests) {
    const container = document.getElementById('friendRequestsList');
    const section = document.getElementById('friendRequestsSection');

    container.innerHTML = '';

    if (requests.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    requests.forEach(req => {
        const card = document.createElement('div');
        card.classList.add('request-card');
        card.innerHTML = `
            <div class="card-info">
                <h5>${req.sender.name}</h5>
                <span>wants to be friends</span>
            </div>
            <button class="btn-small" onclick="acceptRequest('${req._id}')">Accept</button>
        `;
        container.appendChild(card);
    });
}

async function acceptRequest(requestId) {
    try {
        const response = await fetch(`${FRIENDS_URL}/accept`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ requestId })
        });

        if (response.ok) {
            loadFriendsView();
        } else {
            alert('Error accepting request');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchFriends() {
    try {
        const response = await fetch(`${FRIENDS_URL}`, {
            headers: getAuthHeaders()
        });
        const friends = await response.json();
        renderFriendsList(friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
    }
}

function renderFriendsList(friends) {
    const container = document.getElementById('friendsList');
    container.innerHTML = '';

    if (friends.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.9rem;">You have no friends yet.</p>';
        return;
    }

    friends.forEach(friend => {
        const card = document.createElement('div');
        card.classList.add('friend-card');
        card.onclick = () => loadFriendBooks(friend);
        card.innerHTML = `
            <div class="card-info">
                <h5>${friend.name}</h5>
                <span>${friend.email}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <i class="bi bi-person-dash" onclick="event.stopPropagation(); unfriendUser('${friend._id}', '${friend.name}')" style="color: var(--danger); opacity: 0.7; cursor: pointer;" title="Unfriend"></i>
                <i class="bi bi-chevron-right" style="color: var(--text-muted);"></i>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadFriendBooks(friend) {
    // Visual feedback for selection
    document.querySelectorAll('.friend-card').forEach(c => c.classList.remove('active'));
    // Ideally verify which card was clicked, but simpler to just re-fetch or use event delegation.
    // simpler:

    try {
        const response = await fetch(`${FRIENDS_URL}/${friend._id}/books`, {
            headers: getAuthHeaders()
        });
        const books = await response.json();
        renderFriendBooks(friend, books);
    } catch (error) {
        console.error('Error loading friend books:', error);
    }
}

function renderFriendBooks(friend, books) {
    const container = document.getElementById('friendContentArea');

    // Header
    let html = `
        <div class="main-header">
            <h2 class="section-title">${friend.name}'s Books</h2>
        </div>
    `;

    if (books.length === 0) {
        html += '<p class="no-books-msg">This friend has no public books.</p>';
        container.innerHTML = html;
        return;
    }

    // Reuse render logic but simplified for read-only
    const booksByYear = books.reduce((acc, book) => {
        const year = book.anoLeitura || 'Unknown';
        if (!acc[year]) acc[year] = [];
        acc[year].push(book);
        return acc;
    }, {});

    const sortedYears = Object.keys(booksByYear).sort((a, b) => b - a);

    // Add Unfriend Button to Header
    html += `
        <div style="margin-bottom: 20px;">
            <button onclick="unfriendUser('${friend._id}', '${friend.name}')" style="background: rgba(255, 118, 117, 0.1); color: var(--danger); border: 1px solid var(--danger); padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                <i class="bi bi-person-dash"></i> Unfriend
            </button>
        </div>
    `;

    sortedYears.forEach(year => {
        const isCollapsed = collapsedYears.has(`friend-${year}`);
        html += `
            <div class="year-section ${isCollapsed ? 'collapsed' : ''}" data-year="${year}">
                <div class="year-header">
                     <h3>${year} <span style="font-size: 0.8em; opacity: 0.6; margin-left: 10px;">(${booksByYear[year].length} books)</span></h3>
                     <button class="btn-minimize ${isCollapsed ? 'collapsed' : ''}" onclick="toggleFriendYearCollapse('${year}', this)">
                        <i class="bi bi-chevron-up"></i>
                    </button>
                </div>
                <div class="books-grid" style="${isCollapsed ? 'display:none;' : ''}">
                    ${booksByYear[year].map(book => createReadOnlyBookCard(book)).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.toggleFriendYearCollapse = (year, btn) => {
    const key = `friend-${year}`;
    if (collapsedYears.has(key)) {
        collapsedYears.delete(key);
    } else {
        collapsedYears.add(key);
    }
    const section = btn.closest('.year-section');
    section.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');

    // Manually toggle grid visibility for immediate effect without re-render
    const grid = section.querySelector('.books-grid');
    if (grid) {
        grid.style.display = section.classList.contains('collapsed') ? 'none' : 'grid';
    }
}

window.unfriendUser = async (friendId, friendName) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) return;

    try {
        const response = await fetch(`${FRIENDS_URL}/${friendId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert(`${friendName} removed.`);
            loadFriendsView(); // Reload list
            document.getElementById('friendContentArea').innerHTML = `
                <div class="placeholder-message">
                    <i class="bi bi-people" style="font-size: 3rem; opacity: 0.5;"></i>
                    <p>Select a friend to view their books</p>
                </div>
            `;
        } else {
            alert('Failed to remove friend');
        }
    } catch (error) {
        console.error('Error removing friend:', error);
    }
}

function createReadOnlyBookCard(book) {
    const coverImg = book.capaUrl ? `<img src="${book.capaUrl}" alt="${book.titulo}">` : '<div class="no-cover"><i class="bi bi-book"></i><br>No Cover</div>';

    // We render HTML string directly for friend view instead of DOM elements for simplicity in this injection
    return `
        <div class="book-card" onclick="openReadOnlyDetailsEx('${book.titulo.replace(/'/g, "\\'")}', '${book.autor}', '${book.nota}', '${book.status}', '${book.sinopse ? book.sinopse.replace(/'/g, "\\'") : ''}', '${book.capaUrl}')">
            <div class="card-cover">
                ${coverImg}
                <div class="card-overlay">
                    <span class="rating-badge"><i class="bi bi-star-fill"></i> ${book.nota || '-'}</span>
                </div>
            </div>
            <div class="book-info">
                <h4>${book.titulo}</h4>
                <p>${Array.isArray(book.autor) ? book.autor.join(', ') : book.autor}</p>
                <div class="status-dot ${book.status.toLowerCase().replace(' ', '-')}"></div>
            </div>
        </div>
    `;
}

// Helper for Friend Book Details (Global because of string injection)
window.openReadOnlyDetailsEx = (titulo, autor, nota, status, sinopse, capaUrl) => {
    const detailsContainer = document.getElementById('bookDetails');
    if (capaUrl === 'undefined' || capaUrl === 'null') capaUrl = '';

    const coverImg = capaUrl ? `<img src="${capaUrl}" alt="${titulo}" class="detail-cover">` : '<div class="no-cover-detail"><i class="bi bi-book"></i></div>';

    detailsContainer.innerHTML = `
        <div class="detail-layout">
            <div class="detail-image">
                ${coverImg}
            </div>
            <div class="detail-info">
                <h3>${titulo}</h3>
                <p><strong>Author:</strong> ${autor}</p>
                
                <div class="rating-display" style="margin-top: 20px;">
                    <strong>Rating:</strong> <span class="stars">${renderStars(nota)}</span> (${nota}/10)
                </div>
                <div class="status-badge ${status.toLowerCase().replace(' ', '-')}">${status}</div>
                
                <div class="synopsis">
                    <h4>Synopsis</h4>
                    <p>${sinopse || 'No synopsis available.'}</p>
                </div>
            </div>
        </div>
    `;
    document.getElementById('detailsModal').style.display = 'block';
}
