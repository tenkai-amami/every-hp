document.addEventListener('DOMContentLoaded', () => {
    // Fade-in Animation Observer
    const fadeElements = document.querySelectorAll('.fade-in');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Run once
            }
        });
    }, {
        threshold: 0.1
    });

    fadeElements.forEach(el => observer.observe(el));

    // Header Element
    const header = document.querySelector('.header');

    // --- Hamburger Menu Logic ---
    const hamburger = document.querySelector('.header__hamburger');
    const nav = document.querySelector('.header__nav');
    const overlay = document.querySelector('.header__overlay');
    const body = document.body;

    function toggleMenu() {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        body.classList.toggle('no-scroll'); // Prevent background scrolling
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking links
    const navLinks = document.querySelectorAll('.header__item a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    const shapes = document.querySelectorAll('.shape');

    // Performance optimized scroll handling
    let ticking = false;
    let lastScrollY = 0;

    // Parallax Function (Scroll based) - Optimized with requestAnimationFrame
    const updateParallax = () => {
        shapes.forEach((shape) => {
            // Get speed from data attribute, default to 0.1
            const speed = parseFloat(shape.getAttribute('data-speed') || 0.1);

            // "Larger moves slower" or specific feels.
            // Move up against scroll to create depth
            const yPos = lastScrollY * speed;
            shape.style.transform = `translateY(${yPos * -1}px)`;
        });
        ticking = false;
    };

    const handleScroll = () => {
        lastScrollY = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial trigger
    handleScroll();

    // --- MicroCMS Integration ---
    const MICROCMS_API_KEY = 'BCoNPYjUyHOU2WemqH36H9xiJWYKoa5JFbfJ';
    // TODO: Replace with User's Service Domain
    const MICROCMS_SERVICE_DOMAIN = 'every';
    const MICROCMS_ENDPOINT = 'news';

    const fetchNews = async () => {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;

        if (MICROCMS_SERVICE_DOMAIN === 'YOUR_SERVICE_DOMAIN') {
            newsList.innerHTML = '<p class="news-error">Service Domainが設定されていません。</p>';
            return;
        }

        try {
            const response = await fetch(`https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/${MICROCMS_ENDPOINT}?limit=3`, {
                headers: {
                    'X-MICROCMS-API-KEY': MICROCMS_API_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const contents = data.contents;

            if (!contents || contents.length === 0) {
                newsList.innerHTML = '<p class="news-loading">現在、お知らせはありません。</p>';
                return;
            }

            let html = '';
            contents.forEach(post => {
                // Format Date (YYYY.MM.DD)
                const date = new Date(post.publishedAt || post.createdAt);
                const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

                // Safe Category Parsing
                let categoryLabel = 'Info';
                if (post.category) {
                    if (Array.isArray(post.category)) {
                        categoryLabel = post.category[0] || 'Info';
                        // If it's an array of objects
                        if (typeof categoryLabel === 'object' && categoryLabel.name) {
                            categoryLabel = categoryLabel.name;
                        }
                    } else if (typeof post.category === 'object' && post.category !== null) {
                        // Object (Select field return)
                        categoryLabel = post.category.name || 'Info';
                    } else {
                        // String
                        categoryLabel = String(post.category);
                    }
                }

                // Add data attributes for modal
                html += `
                    <a href="#" class="news-item" data-id="${post.id}">
                        <span class="news-date">${formattedDate}</span>
                        <span class="news-category ${String(categoryLabel).toLowerCase()}">${categoryLabel}</span>
                        <span class="news-title">${post.title}</span>
                    </a>
                `;
            });

            newsList.innerHTML = html;

            // Add Click Listeners for Modal
            const newsItems = newsList.querySelectorAll('.news-item');
            const modal = document.getElementById('news-modal');
            const modalClose = document.querySelector('.news-modal__close');
            const modalOverlay = document.querySelector('.news-modal__overlay');

            // Modal Elements
            const modalDate = document.querySelector('.news-modal__date');
            const modalCategory = document.querySelector('.news-modal__category');
            const modalTitle = document.querySelector('.news-modal__title');
            const modalBody = document.querySelector('.news-modal__body');

            const closeModal = () => {
                modal.classList.remove('active');
                document.body.classList.remove('no-scroll');
            };

            modalClose.addEventListener('click', closeModal);
            modalOverlay.addEventListener('click', closeModal);

            newsItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const id = item.getAttribute('data-id');
                    const post = contents.find(c => c.id === id);

                    if (post) {
                        // Populate Modal
                        const date = new Date(post.publishedAt || post.createdAt);
                        modalDate.textContent = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

                        // Category (Reuse logic simplified)
                        let categoryLabel = 'Info';
                        if (post.category) {
                            if (Array.isArray(post.category)) {
                                categoryLabel = post.category[0] || 'Info';
                                if (typeof categoryLabel === 'object' && categoryLabel.name) categoryLabel = categoryLabel.name;
                            } else if (typeof post.category === 'object' && post.category !== null) {
                                categoryLabel = post.category.name || 'Info';
                            } else {
                                categoryLabel = String(post.category);
                            }
                        }
                        modalCategory.textContent = categoryLabel;
                        modalTitle.textContent = post.title;
                        modalBody.innerHTML = post.content || '<p>詳細はありません。</p>';

                        // Show Modal
                        modal.classList.add('active');
                        document.body.classList.add('no-scroll');
                    }
                });
            });

        } catch (error) {
            console.error('MicroCMS Fetch Error:', error);
            newsList.innerHTML = '<p class="news-error">お知らせの読み込みに失敗しました。</p>';
        }
    };

    fetchNews();
});
