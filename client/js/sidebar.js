const nav_links = document.querySelectorAll('.itens-sidebar');

nav_links.forEach(link => {
    link.addEventListener('click', function () {
        nav_links.forEach(item => item.classList.remove('active'));
        this.classList.add('active');

        // Close sidebar on mobile when a link is clicked
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});

window.toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};