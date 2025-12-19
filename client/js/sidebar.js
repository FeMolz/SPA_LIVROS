const nav_links = document.querySelectorAll('.itens-sidebar');

nav_links.forEach(link => {
    link.addEventListener('click', function () {
        nav_links.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
    });
});