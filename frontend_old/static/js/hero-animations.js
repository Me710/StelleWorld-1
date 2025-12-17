/**
 * Animations et effets de scroll pour la page d'accueil StelleWorld
 * Gère les animations de parallax, de réduction au scroll et les transitions fluides
 */

class HeroAnimations {
    constructor() {
        this.heroSection = document.getElementById('hero-section');
        this.heroVideo = document.getElementById('hero-video');
        this.bestSellersSection = document.getElementById('best-sellers-section');
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.setupVideoOptimizations();
        this.setupIntersectionObserver();
        this.setupParticleAnimations();
        
        // Démarrer les animations initiales
        this.startInitialAnimations();
    }

    /**
     * Configuration des animations de scroll
     */
    setupScrollAnimations() {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateScrollAnimations = () => {
            const scrollY = window.scrollY;
            const heroHeight = this.heroSection ? this.heroSection.offsetHeight : 0;
            const scrollProgress = Math.min(scrollY / heroHeight, 1);

            // Animation de réduction de la section hero
            if (this.heroSection) {
                this.animateHeroSection(scrollProgress, scrollY);
            }

            // Animation de parallax pour les éléments
            this.animateParallaxElements(scrollY);

            lastScrollY = scrollY;
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    /**
     * Animation de la section hero au scroll
     */
    animateHeroSection(scrollProgress, scrollY) {
        const heroContent = this.heroSection.querySelector('.relative.z-10');
        const heroTitle = this.heroSection.querySelector('h1');
        const heroSubtitle = this.heroSection.querySelector('p');
        const heroButtons = this.heroSection.querySelector('.flex.flex-col.sm\\:flex-row');
        const scrollIndicator = this.heroSection.querySelector('.absolute.bottom-8');

        if (!heroContent) return;

        // Réduction progressive de la section
        if (scrollProgress > 0.1) {
            this.heroSection.classList.add('hero-shrink');
            if (this.heroVideo) {
                this.heroVideo.classList.add('hero-video-shrink');
            }
        } else {
            this.heroSection.classList.remove('hero-shrink');
            if (this.heroVideo) {
                this.heroVideo.classList.remove('hero-video-shrink');
            }
        }

        // Animation du contenu
        if (scrollProgress > 0.3) {
            heroContent.classList.add('hero-content-shrink');
            if (heroTitle) heroTitle.classList.add('hero-title-shrink');
            if (heroSubtitle) heroSubtitle.classList.add('hero-subtitle-shrink');
        } else {
            heroContent.classList.remove('hero-content-shrink');
            if (heroTitle) heroTitle.classList.remove('hero-title-shrink');
            if (heroSubtitle) heroSubtitle.classList.remove('hero-subtitle-shrink');
        }

        // Masquer l'indicateur de scroll
        if (scrollIndicator) {
            if (scrollProgress > 0.2) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.transform = 'translateX(-50%) translateY(20px)';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
            }
        }

        // Animation des boutons
        if (heroButtons) {
            if (scrollProgress > 0.4) {
                heroButtons.style.transform = 'scale(0.9)';
                heroButtons.style.opacity = '0.8';
            } else {
                heroButtons.style.transform = 'scale(1)';
                heroButtons.style.opacity = '1';
            }
        }
    }

    /**
     * Configuration des effets de parallax
     */
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        parallaxElements.forEach(element => {
            element.style.willChange = 'transform';
        });
    }

    /**
     * Animation des éléments de parallax
     */
    animateParallaxElements(scrollY) {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1); // Vitesse différente pour chaque élément
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    /**
     * Configuration de l'Intersection Observer pour les animations d'apparition
     */
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animation spéciale pour les cartes de produits
                    if (entry.target.classList.contains('product-card')) {
                        this.animateProductCards(entry.target);
                    }
                }
            });
        }, observerOptions);

        // Observer les sections
        const sections = document.querySelectorAll('.section-fade-in, .best-sellers-slide-in, .product-card');
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    /**
     * Animation des cartes de produits
     */
    animateProductCards(container) {
        const cards = container.querySelectorAll('.group');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100); // Délai progressif
        });
    }

    /**
     * Configuration des optimisations vidéo
     */
    setupVideoOptimizations() {
        if (!this.heroVideo) return;

        // Pause la vidéo quand elle n'est pas visible
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.heroVideo.play().catch(e => console.log('Video play failed:', e));
                } else {
                    this.heroVideo.pause();
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(this.heroVideo);

        // Optimisation pour mobile
        if (window.innerWidth < 768) {
            this.heroVideo.muted = true;
            this.heroVideo.playsInline = true;
        }
    }

    /**
     * Configuration des animations de particules
     */
    setupParticleAnimations() {
        const particles = document.querySelectorAll('.particle');
        
        particles.forEach((particle, index) => {
            // Position aléatoire initiale
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        });
    }

    /**
     * Démarrage des animations initiales
     */
    startInitialAnimations() {
        // Animation d'apparition du titre
        const title = document.querySelector('#hero-section h1');
        if (title) {
            title.style.opacity = '0';
            title.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                title.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 300);
        }

        // Animation d'apparition du sous-titre
        const subtitle = document.querySelector('#hero-section p');
        if (subtitle) {
            subtitle.style.opacity = '0';
            subtitle.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                subtitle.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                subtitle.style.opacity = '1';
                subtitle.style.transform = 'translateY(0)';
            }, 600);
        }

        // Animation d'apparition des boutons
        const buttons = document.querySelector('#hero-section .flex.flex-col.sm\\:flex-row');
        if (buttons) {
            buttons.style.opacity = '0';
            buttons.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                buttons.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                buttons.style.opacity = '1';
                buttons.style.transform = 'translateY(0)';
            }, 900);
        }
    }

    /**
     * Animation de révélation de texte lettre par lettre
     */
    animateTextReveal(element) {
        const text = element.textContent;
        element.innerHTML = '';
        element.classList.add('text-reveal');
        
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${index * 0.05}s`;
            element.appendChild(span);
        });
    }

    /**
     * Animation de gradient pour les boutons
     */
    animateGradientButton(button) {
        button.classList.add('gradient-button');
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundSize = '200% 200%';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundSize = '300% 300%';
        });
    }

    /**
     * Animation de pulsation pour les badges
     */
    animateBadgePulse(badge) {
        badge.classList.add('badge-pulse');
    }

    /**
     * Gestion des événements de scroll pour les performances
     */
    handleScroll() {
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 16); // ~60fps
    }

    /**
     * Nettoyage des événements
     */
    destroy() {
        window.removeEventListener('scroll', this.handleScroll);
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
    }
}

// Initialisation automatique quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les animations sont supportées
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('Animations réduites activées pour l\'accessibilité');
        return;
    }
    
    // Initialiser les animations
    window.heroAnimations = new HeroAnimations();
    
    // Gestion du redimensionnement
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.heroAnimations) {
                window.heroAnimations.setupVideoOptimizations();
            }
        }, 250);
    });
});

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroAnimations;
}
