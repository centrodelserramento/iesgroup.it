// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Intersection Observer for Scroll Animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.fade-in-up');
  animatedElements.forEach(el => {
    observer.observe(el);
  });
});

console.log('Iesgroup App Initialized with High Performance Vanilla Setup');

// Form Submission
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset message
    formMessage.className = 'form-message';
    formMessage.textContent = '';
    formMessage.style.display = 'none';
    
    // Disable button and show loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso...';
    
    const formData = new FormData(contactForm);
    
    try {
      const response = await fetch('https://proposa.it/ies/contatto/api/', {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        formMessage.classList.add('success');
        formMessage.textContent = 'Grazie! La tua richiesta è stata inviata con successo. Ti ricontatteremo a breve.';
        contactForm.reset();
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error(data.error || 'Si è verificato un errore durante l\'invio. Riprova più tardi.');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      formMessage.classList.add('error');
      formMessage.textContent = error.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// Prefill form from URL fragment
function prefillForm() {
  const hash = window.location.hash;
  if (hash.includes('?service=')) {
    const serviceName = decodeURIComponent(hash.split('?service=')[1]);
    const descField = document.getElementById('descrizione_intervento');
    if (descField) {
      descField.value = 'Richiesta per: ' + serviceName + '\n\n';
      // Focus the description field to show the user it was prefilled
      descField.focus();
    }
  }
}

// Check on load and on hash change
window.addEventListener('load', prefillForm);
window.addEventListener('hashchange', prefillForm);
